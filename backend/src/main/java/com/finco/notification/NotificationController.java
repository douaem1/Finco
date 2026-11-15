package com.finco.notification;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * API des notifications de l'utilisateur authentifié.
 * Aucun paramètre ne permet de viser un autre utilisateur : tout est dérivé du jeton.
 */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @GetMapping
    public NotificationsPageResponse lister(@RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "20") int size,
                                            @RequestParam(defaultValue = "false") boolean nonLuesSeulement,
                                            Authentication authentication) {
        return service.lister(authentication.getName(), page, size, nonLuesSeulement);
    }

    @GetMapping("/non-lues/count")
    public CompteurNotificationsResponse compterNonLues(Authentication authentication) {
        return new CompteurNotificationsResponse(service.compterNonLues(authentication.getName()));
    }

    @PatchMapping("/{id}/lue")
    public void marquerLue(@PathVariable Long id, Authentication authentication) {
        service.marquerLue(id, authentication.getName());
    }

    @PatchMapping("/tout-lire")
    public void toutMarquerLu(Authentication authentication) {
        service.toutMarquerLu(authentication.getName());
    }
}
