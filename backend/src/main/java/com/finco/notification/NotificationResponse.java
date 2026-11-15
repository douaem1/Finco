package com.finco.notification;

import java.time.LocalDateTime;

/** Notification exposée à l'API : jamais l'entité, uniquement des champs sûrs. */
public record NotificationResponse(
        Long id,
        String type,
        String severite,
        String message,
        String lien,
        boolean lu,
        LocalDateTime dateCreation,
        String entiteLieeType,
        Long entiteLieeId
) {
    public static NotificationResponse depuis(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType().name(),
                notification.getSeverite().name(),
                notification.getMessage(),
                notification.getLien(),
                notification.isLu(),
                notification.getDateCreation(),
                notification.getEntiteLieeType(),
                notification.getEntiteLieeId());
    }
}
