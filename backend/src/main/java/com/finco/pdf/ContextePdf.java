package com.finco.pdf;

import com.finco.audit.ContexteRequete;
import com.finco.entity.Societe;
import com.finco.entity.Utilisateur;
import com.finco.entity.enums.Role;
import com.finco.repository.SocieteRepository;
import com.finco.repository.UtilisateurRepository;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Contexte commun aux documents PDF : société, utilisateur courant, horodatage.
 * Centralise la récupération des métadonnées d'en-tête et de pied de page.
 */
@Component
public class ContextePdf {

    private static final DateTimeFormatter HORODATAGE = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DateTimeFormatter JOUR = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final SocieteRepository societeRepository;
    private final UtilisateurRepository utilisateurRepository;

    public ContextePdf(SocieteRepository societeRepository, UtilisateurRepository utilisateurRepository) {
        this.societeRepository = societeRepository;
        this.utilisateurRepository = utilisateurRepository;
    }

    /** Raison sociale de la société (première trouvée) ou « FinCo » par défaut. */
    public String societe() {
        return societeRepository.findAll().stream()
                .findFirst()
                .map(Societe::getRaisonSociale)
                .filter(rs -> rs != null && !rs.isBlank())
                .orElse("FinCo");
    }

    public Utilisateur utilisateurCourant() {
        String email = ContexteRequete.emailUtilisateur();
        if (email == null) {
            return null;
        }
        return utilisateurRepository.findByEmail(email.toLowerCase()).orElse(null);
    }

    public String nomUtilisateur() {
        Utilisateur utilisateur = utilisateurCourant();
        return utilisateur != null ? utilisateur.getNomComplet() : "Système";
    }

    public String roleUtilisateur() {
        Utilisateur utilisateur = utilisateurCourant();
        return utilisateur != null ? libelleRole(utilisateur.getRole()) : "";
    }

    public String maintenant() {
        return LocalDateTime.now().format(HORODATAGE);
    }

    public String jour(LocalDate date) {
        return date != null ? date.format(JOUR) : "";
    }

    /** Libellé français d'un rôle. */
    public static String libelleRole(Role role) {
        if (role == null) {
            return "";
        }
        return switch (role) {
            case COMPTABLE -> "Comptable";
            case CONTROLEUR -> "Contrôleur de gestion";
            case DIRECTEUR_FINANCIER -> "Directeur financier";
            case ADMIN -> "Administrateur";
        };
    }
}
