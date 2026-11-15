package com.finco.config;

import com.finco.audit.ActionAudit;
import com.finco.audit.AuditEvent;
import com.finco.audit.AuditRepository;
import com.finco.audit.ResultatAudit;
import com.finco.entity.CentreCout;
import com.finco.entity.CompteGeneral;
import com.finco.entity.Exercice;
import com.finco.entity.LigneEcriture;
import com.finco.entity.PieceComptable;
import com.finco.entity.Utilisateur;
import com.finco.entity.enums.Role;
import com.finco.entity.enums.Sens;
import com.finco.notification.Notification;
import com.finco.notification.NotificationRepository;
import com.finco.notification.SeveriteNotification;
import com.finco.notification.TypeNotification;
import com.finco.repository.CentreCoutRepository;
import com.finco.repository.CompteGeneralRepository;
import com.finco.repository.ExerciceRepository;
import com.finco.repository.PieceComptableRepository;
import com.finco.repository.UtilisateurRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.List;

/**
 * Données de démonstration, insérées au démarrage SI les tables sont vides
 * (reprises du script database/finco_db.sql).
 *
 * CommandLineRunner : Spring exécute run() automatiquement une fois que
 * tous les Beans sont créés. Ici encore, tout est injecté par constructeur.
 */
@Component
public class DonneesInitiales implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DonneesInitiales.class);
    private static final String MOT_DE_PASSE_DEMO = "admin123";

    private final UtilisateurRepository utilisateurRepository;
    private final CompteGeneralRepository compteRepository;
    private final ExerciceRepository exerciceRepository;
    private final CentreCoutRepository centreCoutRepository;
    private final PieceComptableRepository pieceRepository;
    private final NotificationRepository notificationRepository;
    private final AuditRepository auditRepository;
    private final PasswordEncoder passwordEncoder;

    public DonneesInitiales(UtilisateurRepository utilisateurRepository,
                            CompteGeneralRepository compteRepository,
                            ExerciceRepository exerciceRepository,
                            CentreCoutRepository centreCoutRepository,
                            PieceComptableRepository pieceRepository,
                            NotificationRepository notificationRepository,
                            AuditRepository auditRepository,
                            PasswordEncoder passwordEncoder) {
        this.utilisateurRepository = utilisateurRepository;
        this.compteRepository = compteRepository;
        this.exerciceRepository = exerciceRepository;
        this.centreCoutRepository = centreCoutRepository;
        this.pieceRepository = pieceRepository;
        this.notificationRepository = notificationRepository;
        this.auditRepository = auditRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        String hache = passwordEncoder.encode(MOT_DE_PASSE_DEMO);
        garantirUtilisateur("Alami", "Karim", "admin@finco.ma", Role.ADMIN, hache);
        garantirUtilisateur("Bennani", "Sara", "comptable@finco.ma", Role.COMPTABLE, hache);
        garantirUtilisateur("Tazi", "Youssef", "controleur@finco.ma", Role.CONTROLEUR, hache);
        garantirUtilisateur("El Idrissi", "Nadia", "daf@finco.ma", Role.DIRECTEUR_FINANCIER, hache);

        if (compteRepository.count() == 0) {
            compteRepository.saveAll(List.of(
                    new CompteGeneral("3421", "Clients", 3),
                    new CompteGeneral("34552", "État - TVA récupérable sur les charges", 3),
                    new CompteGeneral("4411", "Fournisseurs", 4),
                    new CompteGeneral("4455", "État - TVA facturée", 4),
                    new CompteGeneral("5141", "Banques", 5),
                    new CompteGeneral("5161", "Caisse", 5),
                    new CompteGeneral("6111", "Achats de marchandises", 6),
                    new CompteGeneral("6131", "Locations et charges locatives", 6),
                    new CompteGeneral("6136", "Rémunérations d'intermédiaires et honoraires", 6),
                    new CompteGeneral("6171", "Rémunérations du personnel", 6),
                    new CompteGeneral("7111", "Ventes de marchandises", 7)));
            log.info("Plan comptable de démonstration créé.");
        }

        if (exerciceRepository.count() == 0) {
            exerciceRepository.save(new Exercice(2026, LocalDate.of(2026, 1, 1), LocalDate.of(2026, 12, 31)));
            log.info("Exercice 2026 créé.");
        }

        garantirCentre("ADM", "Administration", false, BigDecimal.ZERO);
        garantirCentre("BAT", "Bâtiments (loyer)", false, BigDecimal.ZERO);
        garantirCentre("PROD", "Production", true, new BigDecimal("600.00"));
        garantirCentre("COM", "Commercial", true, new BigDecimal("250.00"));
        garantirCentre("DIR", "Direction", true, new BigDecimal("150.00"));

        creerEcrituresDemonstration();
        creerNotificationsDemonstration();
        creerAuditDemonstration();
    }

    private void garantirUtilisateur(String nom, String prenom, String email, Role role, String motDePasseHache) {
        if (!utilisateurRepository.existsByEmail(email)) {
            utilisateurRepository.save(new Utilisateur(nom, prenom, email, motDePasseHache, role));
            log.info("Utilisateur de démonstration « {} » ({}) créé.", email, role);
        }
    }

    private void garantirCentre(String code, String libelle, boolean principal, BigDecimal cle) {
        if (!centreCoutRepository.existsByCode(code)) {
            centreCoutRepository.save(new CentreCout(code, libelle, principal, cle));
            log.info("Centre de coûts de démonstration « {} » créé.", code);
        }
    }

    /**
     * Deux charges validées de novembre 2026 permettent de tester immédiatement
     * la ventilation des centres auxiliaires vers les centres principaux.
     */
    private void creerEcrituresDemonstration() {
        String prefixe = "DEMO-CO-2026-11-";
        if (pieceRepository.existsByNumero(prefixe + "01")) {
            return;
        }

        Exercice exercice = exerciceRepository.findByAnnee(2026)
                    .orElseThrow(() -> new IllegalStateException("L'exercice 2026 est requis pour les données de démonstration."));
            Utilisateur comptable = utilisateurRepository.findByEmail("comptable@finco.ma")
                    .orElseThrow(() -> new IllegalStateException("Le comptable de démonstration est requis."));
            CompteGeneral chargeLoyer = compteRepository.findByNumero("6131")
                    .orElseThrow(() -> new IllegalStateException("Le compte 6131 est requis pour les données de démonstration."));
            CompteGeneral chargePersonnel = compteRepository.findByNumero("6171")
                    .orElseThrow(() -> new IllegalStateException("Le compte 6171 est requis pour les données de démonstration."));
            CompteGeneral banque = compteRepository.findByNumero("5141")
                    .orElseThrow(() -> new IllegalStateException("Le compte 5141 est requis pour les données de démonstration."));
            CentreCout administration = centreCoutRepository.findByCode("ADM")
                    .orElseThrow(() -> new IllegalStateException("Le centre ADM est requis pour les données de démonstration."));
            CentreCout batiments = centreCoutRepository.findByCode("BAT")
                    .orElseThrow(() -> new IllegalStateException("Le centre BAT est requis pour les données de démonstration."));

            PieceComptable loyer = piece("DEMO-CO-2026-11-01", "Charge de loyer de démonstration",
                    LocalDate.of(2026, 11, 5), exercice, comptable);
            loyer.ajouterLigne(new LigneEcriture(chargeLoyer, administration, Sens.DEBIT, new BigDecimal("10000.00")));
            loyer.ajouterLigne(new LigneEcriture(banque, null, Sens.CREDIT, new BigDecimal("10000.00")));

            PieceComptable personnel = piece("DEMO-CO-2026-11-02", "Charge de personnel de démonstration",
                    LocalDate.of(2026, 11, 6), exercice, comptable);
            personnel.ajouterLigne(new LigneEcriture(chargePersonnel, batiments, Sens.DEBIT, new BigDecimal("4000.00")));
            personnel.ajouterLigne(new LigneEcriture(banque, null, Sens.CREDIT, new BigDecimal("4000.00")));

            pieceRepository.saveAll(List.of(loyer, personnel));
            log.info("Écritures validées de démonstration créées pour novembre 2026.");
    }

    private PieceComptable piece(String numero, String libelle, LocalDate date,
                                 Exercice exercice, Utilisateur utilisateur) {
        PieceComptable piece = new PieceComptable();
        piece.setNumero(numero);
        piece.setLibelle(libelle);
        piece.setDateEcriture(date);
        piece.setExercice(exercice);
        piece.setUtilisateur(utilisateur);
        piece.setValidee(true);
        return piece;
    }

    /**
     * Quelques notifications d'exemple par rôle pour que la cloche soit visible
     * dès la démonstration. Insérées une seule fois (table vide).
     */
    private void creerNotificationsDemonstration() {
        if (notificationRepository.count() > 0) {
            return;
        }
        notifier("daf@finco.ma", TypeNotification.PAIEMENT_A_VALIDER, SeveriteNotification.WARNING,
                "Un paiement de 12 500,00 MAD attend votre validation.", "/validation-paiements");
        notifier("comptable@finco.ma", TypeNotification.FACTURE_PAYEE, SeveriteNotification.INFO,
                "La facture FAC-DEMO-001 est payée (12 500,00 MAD).", "/factures");
        notifier("controleur@finco.ma", TypeNotification.EXERCICE_CLOTURE, SeveriteNotification.INFO,
                "L'exercice 2026 est clôturé : plus aucune saisie.", "/exercices");
        notifier("daf@finco.ma", TypeNotification.BUDGET_DEPASSE, SeveriteNotification.CRITICAL,
                "Le centre PROD a dépassé son budget planifié.", "/budgets");
        log.info("Notifications de démonstration créées.");
    }

    private void notifier(String email, TypeNotification type, SeveriteNotification severite,
                          String message, String lien) {
        utilisateurRepository.findByEmail(email).ifPresent(destinataire -> {
            Notification notification = new Notification();
            notification.setDestinataire(destinataire);
            notification.setType(type);
            notification.setSeverite(severite);
            notification.setMessage(message);
            notification.setLien(lien);
            notificationRepository.save(notification);
        });
    }

    /**
     * Quelques événements d'audit d'exemple, un par catégorie (plus un échec de
     * connexion), pour que le journal d'audit soit visible dès la démonstration.
     * Insérés une seule fois (table vide).
     */
    private void creerAuditDemonstration() {
        if (auditRepository.count() > 0) {
            return;
        }
        evenementAudit("admin@finco.ma", ActionAudit.CONNEXION_REUSSIE, "UTILISATEUR", null,
                "admin@finco.ma", null, null, "Connexion validée (OTP vérifié)",
                ResultatAudit.SUCCES, "10.0.0.12");
        evenementAudit("comptable@finco.ma", ActionAudit.PIECE_VALIDEE, "PIECE", null,
                "DEMO-CO-2026-11-01", null, null, "Validation de la pièce de loyer",
                ResultatAudit.SUCCES, "10.0.0.21");
        evenementAudit("comptable@finco.ma", ActionAudit.FACTURE_CREEE, "FACTURE", null,
                "FAC-DEMO-001", null, "{\"statut\":\"BROUILLON\"}", "Création d'une facture de démonstration",
                ResultatAudit.SUCCES, "10.0.0.21");
        evenementAudit("daf@finco.ma", ActionAudit.PAIEMENT_VALIDE, "PAIEMENT", null,
                "PAI-DEMO-001", "{\"statut\":\"EN_ATTENTE\"}", "{\"statut\":\"VALIDE\"}",
                "Validation du paiement de démonstration", ResultatAudit.SUCCES, "10.0.0.31");
        evenementAudit("comptable@finco.ma", ActionAudit.EXERCICE_CLOTURE, "EXERCICE", null,
                "Exercice 2025", "{\"statut\":\"OUVERTE\"}", "{\"statut\":\"CLOTUREE\"}",
                "Clôture de l'exercice 2025", ResultatAudit.SUCCES, "10.0.0.21");
        evenementAudit("controleur@finco.ma", ActionAudit.BUDGET_CREE, "BUDGET", null,
                "Budget 2026 PROD", null, "{\"montant\":72000}", "Création du budget du centre PROD",
                ResultatAudit.SUCCES, "10.0.0.41");
        evenementAudit("admin@finco.ma", ActionAudit.UTILISATEUR_CREE, "UTILISATEUR", null,
                "controleur@finco.ma", null, "{\"role\":\"CONTROLEUR\"}", "Création d'un utilisateur",
                ResultatAudit.SUCCES, "10.0.0.12");
        evenementAudit("comptable@finco.ma", ActionAudit.EXPORT_PDF, "GRAND_LIVRE", null,
                "Grand livre", null, null, "Export PDF du grand livre",
                ResultatAudit.SUCCES, "10.0.0.21");
        evenementAudit(null, ActionAudit.CONNEXION_ECHOUEE, "UTILISATEUR", null,
                "i***a@finco.ma", null, null, "Échec de connexion pour i***a@finco.ma",
                ResultatAudit.ECHEC, "203.0.113.9");
        log.info("Événements d'audit de démonstration créés.");
    }

    private void evenementAudit(String email, ActionAudit action, String entiteType, Long entiteId,
                                String reference, String ancienneValeur, String nouvelleValeur,
                                String details, ResultatAudit resultat, String adresseIp) {
        Utilisateur utilisateur = email == null ? null
                : utilisateurRepository.findByEmail(email).orElse(null);
        AuditEvent evenement = AuditEvent.builder()
                .utilisateur(utilisateur != null ? utilisateur.getId() : null,
                        utilisateur != null ? utilisateur.getNomComplet() : null,
                        utilisateur != null ? utilisateur.getRole().name() : null)
                .action(action)
                .entite(entiteType, entiteId, reference)
                .ancienneValeur(ancienneValeur)
                .nouvelleValeur(nouvelleValeur)
                .details(details)
                .resultat(resultat)
                .adresseIp(adresseIp)
                .build();
        auditRepository.save(evenement);
    }
}
