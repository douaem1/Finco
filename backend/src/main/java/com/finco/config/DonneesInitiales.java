package com.finco.config;

import com.finco.entity.CentreCout;
import com.finco.entity.CompteGeneral;
import com.finco.entity.Exercice;
import com.finco.entity.Utilisateur;
import com.finco.entity.enums.Role;
import com.finco.repository.CentreCoutRepository;
import com.finco.repository.CompteGeneralRepository;
import com.finco.repository.ExerciceRepository;
import com.finco.repository.UtilisateurRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
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
    private final PasswordEncoder passwordEncoder;

    public DonneesInitiales(UtilisateurRepository utilisateurRepository,
                            CompteGeneralRepository compteRepository,
                            ExerciceRepository exerciceRepository,
                            CentreCoutRepository centreCoutRepository,
                            PasswordEncoder passwordEncoder) {
        this.utilisateurRepository = utilisateurRepository;
        this.compteRepository = compteRepository;
        this.exerciceRepository = exerciceRepository;
        this.centreCoutRepository = centreCoutRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (utilisateurRepository.count() == 0) {
            String hache = passwordEncoder.encode(MOT_DE_PASSE_DEMO);
            utilisateurRepository.saveAll(List.of(
                    new Utilisateur("admin", hache, "Administrateur", "admin@finco.ma", Role.ADMIN),
                    new Utilisateur("comptable", hache, "Sara Comptable", "compta@finco.ma", Role.COMPTABLE),
                    new Utilisateur("controleur", hache, "Youssef Contrôleur", "cg@finco.ma", Role.CONTROLEUR),
                    new Utilisateur("daf", hache, "Nadia Directrice fin.", "daf@finco.ma", Role.DIRECTEUR_FINANCIER)));
            log.info("Utilisateurs de démonstration créés (mot de passe : {}).", MOT_DE_PASSE_DEMO);
        }

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

        if (centreCoutRepository.count() == 0) {
            centreCoutRepository.saveAll(List.of(
                    new CentreCout("ADM", "Administration", false),
                    new CentreCout("BAT", "Bâtiments (loyer)", false),
                    new CentreCout("PROD", "Production", true),
                    new CentreCout("COM", "Commercial", true),
                    new CentreCout("DIR", "Direction", true)));
            log.info("Centres de coûts de démonstration créés.");
        }
    }
}
