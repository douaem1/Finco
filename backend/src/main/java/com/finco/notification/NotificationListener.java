package com.finco.notification;

import com.finco.entity.Utilisateur;
import com.finco.repository.UtilisateurRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Consommateur des événements métier : transforme chaque événement en notifications
 * APRÈS le commit de la transaction métier.
 *
 * Le listener est totalement isolé : toute erreur est capturée et journalisée.
 * Une notification ne doit JAMAIS faire échouer l'action métier d'origine.
 */
@Component
public class NotificationListener {

    private static final Logger log = LoggerFactory.getLogger(NotificationListener.class);

    private final NotificationService notificationService;
    private final UtilisateurRepository utilisateurRepository;

    public NotificationListener(NotificationService notificationService,
                                UtilisateurRepository utilisateurRepository) {
        this.notificationService = notificationService;
        this.utilisateurRepository = utilisateurRepository;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void surEvenement(NotificationEvenement evenement) {
        if (evenement == null || evenement.cibles() == null) {
            return;
        }
        for (NotificationEvenement.Cible cible : evenement.cibles()) {
            try {
                creerPourCible(evenement, cible);
            } catch (Exception e) {
                log.error("Échec de création d'une notification (type={}, cible={})",
                        evenement.type(), cible, e);
            }
        }
    }

    private void creerPourCible(NotificationEvenement evenement, NotificationEvenement.Cible cible) {
        if (cible.utilisateurId() != null) {
            if (estActeur(evenement, cible.utilisateurId())) {
                return;
            }
            Utilisateur destinataire = utilisateurRepository.findById(cible.utilisateurId()).orElse(null);
            if (destinataire != null && destinataire.isActif()) {
                notificationService.creerPourUtilisateur(destinataire, evenement.type(), evenement.severite(),
                        evenement.message(), evenement.lien(), evenement.entiteLieeType(), evenement.entiteLieeId());
            }
            return;
        }
        if (cible.role() != null) {
            for (Utilisateur destinataire : utilisateurRepository.findByRoleAndActifTrue(cible.role())) {
                if (estActeur(evenement, destinataire.getId())) {
                    continue;
                }
                notificationService.creerPourUtilisateur(destinataire, evenement.type(), evenement.severite(),
                        evenement.message(), evenement.lien(), evenement.entiteLieeType(), evenement.entiteLieeId());
            }
        }
    }

    /** Aucune auto-notification : on ne notifie pas l'utilisateur qui a déclenché l'action. */
    private boolean estActeur(NotificationEvenement evenement, Long utilisateurId) {
        return evenement.acteurId() != null && evenement.acteurId().equals(utilisateurId);
    }
}
