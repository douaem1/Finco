package com.finco.audit;

import com.finco.entity.Utilisateur;
import com.finco.repository.UtilisateurRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Journal d'audit : écriture et lecture des événements.
 *
 * Règle d'or : un échec d'écriture d'audit ne doit pas être silencieux.
 * Il est journalisé en ERROR (avec le requestId) puis rejoué à l'appelant,
 * afin que l'écriture d'audit et la modification métier commitent ou
 * échouent ENSEMBLE (même transaction).
 */
@Service
@Transactional
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);
    private static final int TAILLE_DETAILS_MAX = 500;
    private static final int JOURS_PERIODE_DEFAUT = 30;
    /** Bornes par défaut : jamais de null en base (le JPQL compare directement les dates). */
    private static final LocalDateTime DATE_MIN = LocalDateTime.of(1970, 1, 1, 0, 0);
    private static final LocalDateTime DATE_MAX = LocalDateTime.of(2999, 12, 31, 23, 59);

    private final AuditRepository auditRepository;
    private final UtilisateurRepository utilisateurRepository;

    public AuditService(AuditRepository auditRepository, UtilisateurRepository utilisateurRepository) {
        this.auditRepository = auditRepository;
        this.utilisateurRepository = utilisateurRepository;
    }

    // ------------------------------------------------------------------
    // Écriture
    // ------------------------------------------------------------------

    /** Enregistre un événement réussi pour l'utilisateur courant (même transaction). */
    public void enregistrer(ActionAudit action, String entiteType, Long entiteId, String entiteReference,
                            String ancienneValeur, String nouvelleValeur, String details) {
        ecrire(action, ResultatAudit.SUCCES, utilisateurCourant(), entiteType, entiteId, entiteReference,
                ancienneValeur, nouvelleValeur, details, true);
    }

    /** Variante explicite (utilisateur et résultat imposés), même transaction. */
    public void enregistrer(ActionAudit action, ResultatAudit resultat, Utilisateur utilisateur,
                            String entiteType, Long entiteId, String entiteReference,
                            String ancienneValeur, String nouvelleValeur, String details) {
        ecrire(action, resultat, utilisateur, entiteType, entiteId, entiteReference,
                ancienneValeur, nouvelleValeur, details, true);
    }

    /** Connexion réussie : l'utilisateur est connu mais pas encore dans le SecurityContext. */
    public void enregistrerConnexionReussie(Utilisateur utilisateur) {
        ecrire(ActionAudit.CONNEXION_REUSSIE, ResultatAudit.SUCCES, utilisateur, "UTILISATEUR",
                utilisateur != null ? utilisateur.getId() : null,
                utilisateur != null ? utilisateur.getEmail() : null,
                null, null, "Connexion validée (OTP vérifié)", true);
    }

    /**
     * Connexion échouée : transaction PROPRE (REQUIRES_NEW) car la transaction
     * métier a échoué et va être annulée ; l'audit doit tout de même être écrit.
     * L'email n'est masqué que s'il ne correspond à aucun compte.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void enregistrerConnexionEchouee(String emailTente) {
        String email = emailTente == null ? null : emailTente.trim().toLowerCase();
        boolean existe = email != null && utilisateurRepository.findByEmail(email).isPresent();
        String reference = existe ? email : masquerEmail(email);
        String details = "Échec de connexion pour " + (reference != null ? reference : "(email absent)");
        ecrire(ActionAudit.CONNEXION_ECHOUEE, ResultatAudit.ECHEC, null, "UTILISATEUR",
                null, reference, null, null, details, false);
    }

    /**
     * Enregistre un export (événement de lecture) : si l'écriture échoue, on
     * journalise l'erreur mais l'action continue (l'export ne doit pas casser).
     */
    public void enregistrerExport(ActionAudit action, String entiteType, String entiteReference, String details) {
        try {
            ecrire(action, ResultatAudit.SUCCES, utilisateurCourant(), entiteType, null, entiteReference,
                    null, null, details, false);
        } catch (Exception e) {
            log.error("Échec de journalisation d'export (action={}, requestId={})", action, ContexteRequete.requestId(), e);
        }
    }

    /**
     * Écrit l'événement. Si `propager` est vrai, une erreur d'écriture est
     * journalisée puis relancée (l'action métier échoue avec l'audit).
     */
    private void ecrire(ActionAudit action, ResultatAudit resultat, Utilisateur utilisateur,
                        String entiteType, Long entiteId, String entiteReference,
                        String ancienneValeur, String nouvelleValeur, String details, boolean propager) {
        try {
            AuditEvent evenement = AuditEvent.builder()
                    .action(action)
                    .resultat(resultat)
                    .utilisateur(utilisateur != null ? utilisateur.getId() : null,
                            utilisateur != null ? utilisateur.getNomComplet() : null,
                            utilisateur != null ? utilisateur.getRole().name() : null)
                    .entite(entiteType, entiteId, entiteReference)
                    .ancienneValeur(ancienneValeur)
                    .nouvelleValeur(nouvelleValeur)
                    .details(tronquer(details, TAILLE_DETAILS_MAX))
                    .adresseIp(ContexteRequete.adresseIp())
                    .requestId(ContexteRequete.requestId())
                    .build();
            auditRepository.save(evenement);
        } catch (Exception e) {
            log.error("Échec d'écriture du journal d'audit (action={}, entite={}#{}, requestId={})",
                    action, entiteType, entiteId, ContexteRequete.requestId(), e);
            if (propager) {
                throw e;
            }
        }
    }

    // ------------------------------------------------------------------
    // Lecture
    // ------------------------------------------------------------------

    @Transactional(readOnly = true)
    public AuditPageResponse rechercher(AuditFiltres filtres, Pageable pageable) {
        Page<AuditEvent> page = chercher(filtres, pageable);
        return new AuditPageResponse(
                page.getContent().stream().map(AuditEventResponse::depuis).toList(),
                page.getTotalElements(),
                page.getTotalPages());
    }

    /** Export (PDF / CSV) : renvoie jusqu'à {@code max} événements pour les filtres donnés. */
    @Transactional(readOnly = true)
    public AuditExportResponse exporter(AuditFiltres filtres, int max) {
        Pageable pageable = PageRequest.of(0, Math.max(max, 1), Sort.by(Sort.Direction.DESC, "dateEvenement"));
        Page<AuditEvent> page = chercher(filtres, pageable);
        return new AuditExportResponse(
                page.getContent().stream().map(AuditEventResponse::depuis).toList(),
                page.getTotalElements(),
                page.getTotalElements() > max);
    }

    @Transactional(readOnly = true)
    public AuditEventResponse obtenir(Long id) {
        return auditRepository.findById(id)
                .map(AuditEventResponse::depuis)
                .orElseThrow(() -> new com.finco.exception.RessourceIntrouvableException(
                        "Événement d'audit introuvable (id = " + id + ")."));
    }

    @Transactional(readOnly = true)
    public List<AuditEventResponse> historiqueEntite(String entiteType, Long entiteId) {
        return auditRepository.findByEntiteTypeAndEntiteIdOrderByDateEvenementDesc(entiteType, entiteId)
                .stream().map(AuditEventResponse::depuis).toList();
    }

    @Transactional(readOnly = true)
    public AuditStatistiquesResponse statistiques(LocalDateTime dateFrom, LocalDateTime dateTo) {
        LocalDateTime fin = dateTo != null ? dateTo : LocalDateTime.now();
        LocalDateTime debut = dateFrom != null ? dateFrom : fin.minusDays(JOURS_PERIODE_DEFAUT);

        long total = auditRepository.countByDateEvenementBetween(debut, fin);
        long echecs = auditRepository.countByResultatAndDateEvenementBetween(ResultatAudit.ECHEC, debut, fin);

        Map<String, Long> parCategorie = new LinkedHashMap<>();
        for (Object[] ligne : auditRepository.compterParAction(debut, fin)) {
            ActionAudit action = (ActionAudit) ligne[0];
            long nombre = ((Number) ligne[1]).longValue();
            if (action != null) {
                parCategorie.merge(action.categorie().name(), nombre, Long::sum);
            }
        }

        String categoriePrincipale = null;
        long max = -1;
        for (Map.Entry<String, Long> entree : parCategorie.entrySet()) {
            if (entree.getValue() > max) {
                max = entree.getValue();
                categoriePrincipale = entree.getKey();
            }
        }

        List<AuditUtilisateurStat> top = new ArrayList<>();
        for (Object[] ligne : auditRepository.topUtilisateurs(debut, fin, Pageable.ofSize(5))) {
            top.add(new AuditUtilisateurStat(
                    (String) ligne[0],
                    (String) ligne[1],
                    ((Number) ligne[2]).longValue()));
        }

        String categorieLibelle = categoriePrincipale != null
                ? CategorieAudit.valueOf(categoriePrincipale).libelle() : null;

        return new AuditStatistiquesResponse(
                total, echecs,
                top.isEmpty() ? null : top.get(0).nom(),
                top.isEmpty() ? null : top.get(0).role(),
                categoriePrincipale, categorieLibelle,
                top, parCategorie);
    }

    // ------------------------------------------------------------------

    /**
     * Prépare et exécute la requête de recherche : construit le motif LIKE,
     * remplace les dates nulles par les bornes par défaut et garantit une
     * liste d'actions non vide (JPQL ne supporte pas {@code IN ()}).
     */
    private Page<AuditEvent> chercher(AuditFiltres filtres, Pageable pageable) {
        AuditFiltres f = filtres != null ? filtres : AuditFiltres.vides();
        String texte = (f.texte() == null || f.texte().isBlank())
                ? null : "%" + f.texte().trim().toLowerCase() + "%";
        LocalDateTime from = f.dateFrom() != null ? f.dateFrom() : DATE_MIN;
        LocalDateTime to = f.dateTo() != null ? f.dateTo() : DATE_MAX;
        List<ActionAudit> actions = actionsDe(f.categorie());
        boolean filtrerActions = f.categorie() != null;
        return auditRepository.rechercher(from, to, f.utilisateurId(), f.action(), f.resultat(),
                f.entiteType(), filtrerActions, actions, texte, pageable);
    }

    private List<ActionAudit> actionsDe(CategorieAudit categorie) {
        if (categorie == null) {
            return Arrays.asList(ActionAudit.values());
        }
        return Arrays.stream(ActionAudit.values())
                .filter(action -> action.categorie() == categorie)
                .toList();
    }

    private Utilisateur utilisateurCourant() {
        String email = ContexteRequete.emailUtilisateur();
        if (email == null) {
            return null;
        }
        return utilisateurRepository.findByEmail(email.toLowerCase()).orElse(null);
    }

    /** "sara.bennani@finco.ma" -> "s***i@finco.ma" */
    private String masquerEmail(String email) {
        if (email == null) {
            return null;
        }
        int arobase = email.indexOf('@');
        if (arobase <= 1) {
            return "***" + email.substring(Math.max(arobase, 0));
        }
        return email.charAt(0) + "***" + email.charAt(arobase - 1) + email.substring(arobase);
    }

    private String tronquer(String valeur, int max) {
        if (valeur == null) {
            return null;
        }
        return valeur.length() > max ? valeur.substring(0, max) : valeur;
    }
}
