package com.finco.service;

import com.finco.dto.LigneEcritureRequest;
import com.finco.dto.PieceComptableRequest;
import com.finco.dto.PieceComptableResponse;
import com.finco.entity.CentreCout;
import com.finco.entity.CompteGeneral;
import com.finco.entity.Exercice;
import com.finco.entity.LigneEcriture;
import com.finco.entity.PieceComptable;
import com.finco.entity.Utilisateur;
import com.finco.exception.RegleMetierException;
import com.finco.exception.RessourceIntrouvableException;
import com.finco.repository.CentreCoutRepository;
import com.finco.repository.CompteGeneralRepository;
import com.finco.repository.ExerciceRepository;
import com.finco.repository.PieceComptableRepository;
import com.finco.repository.UtilisateurRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

/**
 * Couche MÉTIER de la saisie d'écritures comptables (partie double).
 *
 * Règles vérifiées ici, côté serveur (React ne fait qu'afficher le message) :
 *  1. libellé et date obligatoires ;
 *  2. la date appartient à un exercice comptable NON clôturé ;
 *  3. au moins 2 lignes ;
 *  4. chaque ligne : compte existant, sens DEBIT/CREDIT, montant > 0 (2 décimales max) ;
 *  5. compte de charges (classe 6) => centre de coûts obligatoire (lien FI -> CO) ;
 *  6. Σ débits = Σ crédits (équilibre de la partie double) ;
 *  7. le numéro PC-AAAA-NNNNN est attribué par le serveur, jamais par le client.
 */
@Service
@Transactional
public class PieceComptableService {

    private static final int LIBELLE_LONGUEUR_MAX = 255;
    private static final DateTimeFormatter FORMAT_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final PieceComptableRepository pieceRepository;
    private final CompteGeneralRepository compteRepository;
    private final CentreCoutRepository centreCoutRepository;
    private final ExerciceRepository exerciceRepository;
    private final UtilisateurRepository utilisateurRepository;

    /** Injection par constructeur des 5 repositories (Beans fournis par Spring Data). */
    public PieceComptableService(PieceComptableRepository pieceRepository,
                                 CompteGeneralRepository compteRepository,
                                 CentreCoutRepository centreCoutRepository,
                                 ExerciceRepository exerciceRepository,
                                 UtilisateurRepository utilisateurRepository) {
        this.pieceRepository = pieceRepository;
        this.compteRepository = compteRepository;
        this.centreCoutRepository = centreCoutRepository;
        this.exerciceRepository = exerciceRepository;
        this.utilisateurRepository = utilisateurRepository;
    }

    @Transactional(readOnly = true)
    public List<PieceComptableResponse> findAll() {
        return pieceRepository.findAllAvecLignes().stream()
                .map(PieceComptableResponse::depuis)
                .toList();
    }

    @Transactional(readOnly = true)
    public PieceComptableResponse findById(Long id) {
        return pieceRepository.findAvecLignes(id)
                .map(PieceComptableResponse::depuis)
                .orElseThrow(() -> new RessourceIntrouvableException("Pièce comptable introuvable (id = " + id + ")."));
    }

    /**
     * Enregistre une nouvelle écriture, en brouillon (validee = false).
     * @param emailSaisisseur email de l'utilisateur connecté (issu du jeton JWT), fourni par le controller
     */
    public PieceComptableResponse create(PieceComptableRequest requete, String emailSaisisseur) {
        if (requete == null) {
            throw new RegleMetierException("Aucune donnée reçue.");
        }

        // Règle 1 : en-tête
        String libelle = verifierLibelle(requete.libelle());
        LocalDate date = requete.dateEcriture();
        if (date == null) {
            throw new RegleMetierException("La date de l'écriture est obligatoire.");
        }

        // Règle 2 : exercice ouvert
        Exercice exercice = exerciceRepository
                .findFirstByDateDebutLessThanEqualAndDateFinGreaterThanEqual(date, date)
                .orElseThrow(() -> new RegleMetierException(
                        "Aucun exercice comptable ne couvre la date du " + date.format(FORMAT_DATE) + "."));
        if (exercice.isCloture()) {
            throw new RegleMetierException("L'exercice " + exercice.getAnnee() + " est clôturé : saisie impossible.");
        }

        // Règle 3 : au moins deux lignes
        List<LigneEcritureRequest> lignesSaisies = requete.lignes();
        if (lignesSaisies == null || lignesSaisies.size() < 2) {
            throw new RegleMetierException("Une écriture doit comporter au moins 2 lignes (un débit et un crédit).");
        }

        PieceComptable piece = new PieceComptable();
        piece.setLibelle(libelle);
        piece.setDateEcriture(date);
        piece.setExercice(exercice);
        piece.setValidee(false);
        piece.setUtilisateur(trouverUtilisateur(emailSaisisseur));

        // Règles 4 et 5 : ligne par ligne
        for (int i = 0; i < lignesSaisies.size(); i++) {
            piece.ajouterLigne(construireLigne(lignesSaisies.get(i), i + 1));
        }

        // Règle 6 : équilibre. compareTo et non equals : 100.0 et 100.00 sont égaux.
        BigDecimal totalDebit = piece.totalDebit();
        BigDecimal totalCredit = piece.totalCredit();
        if (totalDebit.compareTo(totalCredit) != 0) {
            throw new RegleMetierException("Écriture déséquilibrée : total débit = " + mad(totalDebit)
                    + ", total crédit = " + mad(totalCredit)
                    + " (écart de " + mad(totalDebit.subtract(totalCredit).abs()) + ").");
        }

        // Règle 7 : numéro séquentiel par exercice
        piece.setNumero(prochainNumero(exercice.getAnnee()));

        PieceComptable enregistree = pieceRepository.save(piece);
        return PieceComptableResponse.depuis(enregistree);
    }

    // ---------------------------------------------------------------- règles détaillées

    private LigneEcriture construireLigne(LigneEcritureRequest saisie, int numeroLigne) {
        String prefixe = "Ligne " + numeroLigne + " : ";
        if (saisie == null) {
            throw new RegleMetierException(prefixe + "ligne vide.");
        }
        if (saisie.compteId() == null) {
            throw new RegleMetierException(prefixe + "le compte est obligatoire.");
        }
        CompteGeneral compte = compteRepository.findById(saisie.compteId())
                .orElseThrow(() -> new RegleMetierException(prefixe + "compte introuvable dans le plan comptable."));

        if (saisie.sens() == null) {
            throw new RegleMetierException(prefixe + "le sens (débit ou crédit) est obligatoire.");
        }
        BigDecimal montant = saisie.montant();
        if (montant == null || montant.signum() <= 0) {
            throw new RegleMetierException(prefixe + "le montant doit être strictement positif.");
        }
        if (montant.stripTrailingZeros().scale() > 2) {
            throw new RegleMetierException(prefixe + "le montant ne peut pas avoir plus de 2 décimales.");
        }

        CentreCout centre = null;
        if (saisie.centreCoutId() != null) {
            centre = centreCoutRepository.findById(saisie.centreCoutId())
                    .orElseThrow(() -> new RegleMetierException(prefixe + "centre de coûts introuvable."));
        }
        if (compte.estCompteDeCharges() && centre == null) {
            throw new RegleMetierException(prefixe + "le compte " + compte.getNumero()
                    + " est un compte de charges (classe 6), un centre de coûts est obligatoire.");
        }

        return new LigneEcriture(compte, centre, saisie.sens(), montant.setScale(2));
    }

    private String verifierLibelle(String libelle) {
        if (libelle == null || libelle.isBlank()) {
            throw new RegleMetierException("Le libellé de l'écriture est obligatoire.");
        }
        String propre = libelle.trim();
        if (propre.length() > LIBELLE_LONGUEUR_MAX) {
            throw new RegleMetierException("Le libellé ne doit pas dépasser " + LIBELLE_LONGUEUR_MAX + " caractères.");
        }
        return propre;
    }

    private Utilisateur trouverUtilisateur(String email) {
        return utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RessourceIntrouvableException("Utilisateur connecté introuvable : " + email));
    }

    /** PC-2026-00001, PC-2026-00002... (dernier numéro de l'année + 1). */
    private String prochainNumero(int annee) {
        String prefixe = "PC-" + annee + "-";
        int suivant = pieceRepository.findFirstByNumeroStartingWithOrderByNumeroDesc(prefixe)
                .map(derniere -> Integer.parseInt(derniere.getNumero().substring(prefixe.length())) + 1)
                .orElse(1);
        return prefixe + String.format("%05d", suivant);
    }

    /** 36000.5 -> "36 000,50 MAD" */
    private String mad(BigDecimal montant) {
        NumberFormat format = NumberFormat.getNumberInstance(Locale.FRANCE);
        format.setMinimumFractionDigits(2);
        format.setMaximumFractionDigits(2);
        return format.format(montant) + " MAD";
    }
}
