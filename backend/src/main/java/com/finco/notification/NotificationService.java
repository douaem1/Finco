package com.finco.notification;

import com.finco.entity.Utilisateur;
import com.finco.entity.enums.Role;
import com.finco.exception.RessourceIntrouvableException;
import com.finco.repository.UtilisateurRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Création et lecture des notifications. Toutes les lectures sont limitées
 * à l'utilisateur courant : aucune fuite entre utilisateurs.
 */
@Service
@Transactional
public class NotificationService {

    private static final int TAILLE_MAX = 100;
    private static final int LONGUEUR_MESSAGE_MAX = 500;

    private final NotificationRepository notificationRepository;
    private final UtilisateurRepository utilisateurRepository;

    public NotificationService(NotificationRepository notificationRepository,
                               UtilisateurRepository utilisateurRepository) {
        this.notificationRepository = notificationRepository;
        this.utilisateurRepository = utilisateurRepository;
    }

    /**
     * Crée une notification pour un destinataire précis.
     * REQUIRES_NEW : appelée depuis un listener AFTER_COMMIT, elle ouvre sa propre
     * transaction afin que l'écriture soit bien persistée indépendamment de l'action métier.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Notification creerPourUtilisateur(Utilisateur destinataire,
                                             TypeNotification type,
                                             SeveriteNotification severite,
                                             String message,
                                             String lien,
                                             String entiteLieeType,
                                             Long entiteLieeId) {
        if (destinataire == null) {
            return null;
        }
        Notification notification = new Notification();
        notification.setDestinataire(destinataire);
        notification.setType(type);
        notification.setSeverite(severite != null ? severite : SeveriteNotification.INFO);
        notification.setMessage(tronquer(message));
        notification.setLien(lien);
        notification.setEntiteLieeType(entiteLieeType);
        notification.setEntiteLieeId(entiteLieeId);
        return notificationRepository.save(notification);
    }

    /** Crée une notification pour tous les utilisateurs actifs d'un rôle. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void creerPourRole(Role role,
                              TypeNotification type,
                              SeveriteNotification severite,
                              String message,
                              String lien,
                              String entiteLieeType,
                              Long entiteLieeId) {
        List<Utilisateur> destinataires = utilisateurRepository.findByRoleAndActifTrue(role);
        for (Utilisateur destinataire : destinataires) {
            creerPourUtilisateur(destinataire, type, severite, message, lien, entiteLieeType, entiteLieeId);
        }
    }

    @Transactional(readOnly = true)
    public NotificationsPageResponse lister(String email, int page, int size, boolean nonLuesSeulement) {
        Utilisateur utilisateur = utilisateurCourant(email);
        int numero = Math.max(page, 0);
        int taille = Math.min(Math.max(size, 1), TAILLE_MAX);
        Pageable pageable = PageRequest.of(numero, taille);
        Page<Notification> resultat = nonLuesSeulement
                ? notificationRepository.findByDestinataireIdAndLuFalseOrderByDateCreationDesc(utilisateur.getId(), pageable)
                : notificationRepository.findByDestinataireIdOrderByDateCreationDesc(utilisateur.getId(), pageable);
        return new NotificationsPageResponse(
                resultat.getContent().stream().map(NotificationResponse::depuis).toList(),
                resultat.getTotalElements(),
                resultat.getTotalPages());
    }

    @Transactional(readOnly = true)
    public long compterNonLues(String email) {
        Utilisateur utilisateur = utilisateurCourant(email);
        return notificationRepository.countByDestinataireIdAndLuFalse(utilisateur.getId());
    }

    /** Marque une notification en lue, après contrôle d'appartenance. */
    public void marquerLue(Long id, String email) {
        Utilisateur utilisateur = utilisateurCourant(email);
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Notification introuvable (id = " + id + ")."));
        if (!notification.getDestinataire().getId().equals(utilisateur.getId())) {
            throw new AccessDeniedException("Cette notification n'appartient pas à l'utilisateur courant.");
        }
        notification.setLu(true);
        notificationRepository.save(notification);
    }

    public int toutMarquerLu(String email) {
        Utilisateur utilisateur = utilisateurCourant(email);
        return notificationRepository.toutMarquerLu(utilisateur.getId());
    }

    private Utilisateur utilisateurCourant(String email) {
        return utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RessourceIntrouvableException("Utilisateur introuvable."));
    }

    private String tronquer(String message) {
        if (message == null) {
            return null;
        }
        return message.length() > LONGUEUR_MESSAGE_MAX ? message.substring(0, LONGUEUR_MESSAGE_MAX) : message;
    }
}
