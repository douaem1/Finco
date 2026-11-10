package com.finco.service;

import com.finco.dto.FactureRequest;
import com.finco.dto.FactureResponse;
import com.finco.dto.FactureValidationRequest;
import com.finco.dto.LigneEcritureRequest;
import com.finco.dto.PieceComptableRequest;
import com.finco.entity.CentreCout;
import com.finco.entity.CompteGeneral;
import com.finco.entity.Facture;
import com.finco.entity.Fournisseur;
import com.finco.entity.Client;
import com.finco.entity.Tiers;
import com.finco.entity.enums.Sens;
import com.finco.entity.enums.StatutFacture;
import com.finco.entity.enums.TypeFacture;
import com.finco.exception.ConflitMetierException;
import com.finco.exception.RegleMetierException;
import com.finco.exception.RessourceIntrouvableException;
import com.finco.repository.CentreCoutRepository;
import com.finco.repository.CompteGeneralRepository;
import com.finco.repository.FactureRepository;
import com.finco.repository.TiersRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class FactureService {

    private static final BigDecimal TVA_PAR_DEFAUT = new BigDecimal("20.00");
    private final FactureRepository factureRepository;
    private final TiersRepository tiersRepository;
    private final CentreCoutRepository centreCoutRepository;
    private final CompteGeneralRepository compteRepository;
    private final PieceComptableService pieceService;

    public FactureService(FactureRepository factureRepository, TiersRepository tiersRepository,
                          CentreCoutRepository centreCoutRepository, CompteGeneralRepository compteRepository,
                          PieceComptableService pieceService) {
        this.factureRepository = factureRepository;
        this.tiersRepository = tiersRepository;
        this.centreCoutRepository = centreCoutRepository;
        this.compteRepository = compteRepository;
        this.pieceService = pieceService;
    }

    @Transactional(readOnly = true)
    public List<FactureResponse> lister() {
        return factureRepository.findAllByOrderByDateFactureDescIdDesc().stream()
                .map(FactureResponse::depuis)
                .toList();
    }

    @Transactional(readOnly = true)
    public FactureResponse obtenir(Long id) {
        return FactureResponse.depuis(trouver(id));
    }

    public FactureResponse creer(FactureRequest request) {
        verifierRequete(request);
        TypeFacture type = typeDepuis(request == null ? null : request.type());
        String numero = verifierNumero(request.numero());
        LocalDate date = verifierDate(request.dateFacture());
        BigDecimal ht = verifierMontant(request.montantHT());
        BigDecimal tva = verifierTva(request.tauxTVA());
        Tiers tiers = tiersRepository.findByIdForUpdate(verifierTiersId(request.tiersId()))
                .orElseThrow(() -> new RegleMetierException("tiersId", "Le tiers sélectionné est introuvable."));
        verifierTypeTiers(type, tiers);
        if (factureRepository.existsByTiersIdAndNumero(tiers.getId(), numero)) {
            throw new ConflitMetierException("numero", "Ce numéro de facture existe déjà pour ce tiers.");
        }
        return FactureResponse.depuis(factureRepository.save(new Facture(numero, date, type, ht, tva, tiers)));
    }

    public FactureResponse modifier(Long id, FactureRequest request) {
        Facture facture = factureRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Facture introuvable (id = " + id + ")."));
        verifierBrouillon(facture);
        verifierRequete(request);
        TypeFacture type = typeDepuis(request == null ? null : request.type());
        String numero = verifierNumero(request.numero());
        LocalDate date = verifierDate(request.dateFacture());
        BigDecimal ht = verifierMontant(request.montantHT());
        BigDecimal tva = verifierTva(request.tauxTVA());
        Tiers tiers = tiersRepository.findByIdForUpdate(verifierTiersId(request.tiersId()))
                .orElseThrow(() -> new RegleMetierException("tiersId", "Le tiers sélectionné est introuvable."));
        verifierTypeTiers(type, tiers);
        if (factureRepository.existsByTiersIdAndNumero(tiers.getId(), numero)
                && (!tiers.getId().equals(facture.getTiers().getId()) || !numero.equals(facture.getNumero()))) {
            throw new ConflitMetierException("numero", "Ce numéro de facture existe déjà pour ce tiers.");
        }
        facture.setNumero(numero);
        facture.setDateFacture(date);
        facture.setType(type);
        facture.setMontantHT(ht);
        facture.setTauxTVA(tva);
        facture.setTiers(tiers);
        return FactureResponse.depuis(factureRepository.save(facture));
    }

    public FactureResponse valider(Long id, FactureValidationRequest request, String email) {
        Facture facture = factureRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Facture introuvable (id = " + id + ")."));
        verifierBrouillon(facture);
        List<LigneEcritureRequest> lignes = new ArrayList<>();
        BigDecimal ht = facture.getMontantHT().setScale(2, RoundingMode.HALF_UP);
        BigDecimal tva = ht.multiply(facture.getTauxTVA())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal ttc = ht.add(tva).setScale(2, RoundingMode.HALF_UP);

        if (facture.getType() == TypeFacture.ACHAT) {
            if (request == null || request.centreCoutId() == null) {
                throw new RegleMetierException("centreCoutId", "Un centre de coûts est obligatoire pour valider une facture d'achat.");
            }
            CentreCout centre = centreCoutRepository.findById(request.centreCoutId())
                    .orElseThrow(() -> new RegleMetierException("centreCoutId", "Le centre de coûts est introuvable."));
            ajouterLigne(lignes, "6111", centre.getId(), Sens.DEBIT, ht);
            if (tva.signum() > 0) ajouterLigne(lignes, "34552", null, Sens.DEBIT, tva);
            ajouterLigne(lignes, "4411", null, Sens.CREDIT, ttc);
        } else {
            ajouterLigne(lignes, "3421", null, Sens.DEBIT, ttc);
            ajouterLigne(lignes, "7111", null, Sens.CREDIT, ht);
            if (tva.signum() > 0) ajouterLigne(lignes, "4455", null, Sens.CREDIT, tva);
        }

        var piece = pieceService.create(new PieceComptableRequest(
                facture.getDateFacture(), "Facture " + facture.getNumero() + " - " + facture.getTiers().getNom(), lignes), email);
        pieceService.valider(piece.id());
        facture.setPieceComptable(pieceService.findEntity(piece.id()));
        facture.setStatut(StatutFacture.VALIDEE);
        return FactureResponse.depuis(factureRepository.save(facture));
    }

    public void supprimer(Long id) {
        Facture facture = factureRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Facture introuvable (id = " + id + ")."));
        verifierBrouillon(facture);
        factureRepository.delete(facture);
    }

    private void ajouterLigne(List<LigneEcritureRequest> lignes, String numeroCompte, Long centreId,
                              Sens sens, BigDecimal montant) {
        CompteGeneral compte = compteRepository.findByNumero(numeroCompte)
                .orElseThrow(() -> new RegleMetierException("compte",
                        "Le compte " + numeroCompte + " requis pour la comptabilisation de la facture est absent du plan comptable."));
        lignes.add(new LigneEcritureRequest(compte.getId(), centreId, sens, montant));
    }

    private Facture trouver(Long id) {
        return factureRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Facture introuvable (id = " + id + ")."));
    }

    private void verifierBrouillon(Facture facture) {
        if (facture.getStatut() != StatutFacture.BROUILLON) {
            throw new RegleMetierException("Seule une facture en brouillon peut être modifiée ou supprimée.");
        }
    }

    private TypeFacture typeDepuis(String valeur) {
        if ("ACHAT".equals(valeur)) return TypeFacture.ACHAT;
        if ("VENTE".equals(valeur)) return TypeFacture.VENTE;
        throw new RegleMetierException("type", "Le type de facture doit être ACHAT ou VENTE.");
    }

    private void verifierTypeTiers(TypeFacture type, Tiers tiers) {
        boolean correct = type == TypeFacture.ACHAT ? tiers instanceof Fournisseur : tiers instanceof Client;
        if (!correct) {
            throw new RegleMetierException("tiersId", type == TypeFacture.ACHAT
                    ? "Une facture d'achat doit être rattachée à un fournisseur."
                    : "Une facture de vente doit être rattachée à un client.");
        }
    }

    private String verifierNumero(String numero) {
        if (numero == null || numero.isBlank() || numero.trim().length() > 30) {
            throw new RegleMetierException("numero", "Le numéro de facture est obligatoire (30 caractères maximum).");
        }
        return numero.trim();
    }

    private void verifierRequete(FactureRequest request) {
        if (request == null) throw new RegleMetierException("Les données de la facture sont obligatoires.");
    }

    private Long verifierTiersId(Long tiersId) {
        if (tiersId == null) throw new RegleMetierException("tiersId", "Le tiers est obligatoire.");
        return tiersId;
    }

    private LocalDate verifierDate(LocalDate date) {
        if (date == null) throw new RegleMetierException("dateFacture", "La date de facture est obligatoire.");
        if (date.isAfter(LocalDate.now())) {
            throw new RegleMetierException("dateFacture", "La date de facture ne peut pas être dans le futur.");
        }
        return date;
    }

    private BigDecimal verifierMontant(BigDecimal montant) {
        if (montant == null || montant.signum() <= 0 || montant.scale() > 2
                || montant.precision() - montant.scale() > 13) {
            throw new RegleMetierException("montantHT", "Le montant HT doit être positif et comporter au plus deux décimales.");
        }
        return montant.setScale(2);
    }

    private BigDecimal verifierTva(BigDecimal taux) {
        BigDecimal valeur = taux == null ? TVA_PAR_DEFAUT : taux;
        if (valeur.signum() < 0 || valeur.compareTo(new BigDecimal("100.00")) > 0 || valeur.scale() > 2) {
            throw new RegleMetierException("tauxTVA", "Le taux de TVA doit être compris entre 0 et 100, avec deux décimales maximum.");
        }
        return valeur.setScale(2);
    }
}
