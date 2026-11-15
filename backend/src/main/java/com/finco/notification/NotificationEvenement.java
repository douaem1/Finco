package com.finco.notification;

import com.finco.entity.enums.Role;

import java.util.List;

/**
 * Événement métier publié À LA FIN d'une action (création de paiement, validation,
 * clôture d'exercice...). Il n'est consommé qu'APRÈS le commit de la transaction
 * métier : une notification n'est donc jamais créée si l'action échoue.
 */
public record NotificationEvenement(
        TypeNotification type,
        SeveriteNotification severite,
        String message,
        String lien,
        String entiteLieeType,
        Long entiteLieeId,
        Long acteurId,
        List<Cible> cibles
) {

    /** Décrit qui doit recevoir la notification : un utilisateur précis OU un rôle entier. */
    public record Cible(Long utilisateurId, Role role) {
        public static Cible utilisateur(Long utilisateurId) {
            return new Cible(utilisateurId, null);
        }

        public static Cible role(Role role) {
            return new Cible(null, role);
        }
    }
}
