package com.finco.notification;

import java.util.List;

/** Page de notifications renvoyée au frontend. */
public record NotificationsPageResponse(
        List<NotificationResponse> content,
        long totalElements,
        int totalPages
) {
}
