package com.finco.notification;

import com.finco.entity.Utilisateur;
import com.finco.entity.enums.Role;
import com.finco.exception.RessourceIntrouvableException;
import com.finco.repository.UtilisateurRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UtilisateurRepository utilisateurRepository;

    private NotificationService service;

    @BeforeEach
    void setup() {
        service = new NotificationService(notificationRepository, utilisateurRepository);
    }

    private Utilisateur utilisateur(Long id) {
        Utilisateur utilisateur = mock(Utilisateur.class);
        lenient().when(utilisateur.getId()).thenReturn(id);
        lenient().when(utilisateur.isActif()).thenReturn(true);
        return utilisateur;
    }

    private Notification notification(Long id, Utilisateur destinataire, boolean lu) {
        Notification notification = new Notification();
        notification.setId(id);
        notification.setDestinataire(destinataire);
        notification.setType(TypeNotification.PAIEMENT_VALIDE);
        notification.setSeverite(SeveriteNotification.INFO);
        notification.setMessage("message");
        notification.setLien("/paiements");
        notification.setLu(lu);
        return notification;
    }

    @Test
    void compterNonLues_utiliseLUtilisateurCourant() {
        Utilisateur courant = utilisateur(7L);
        when(utilisateurRepository.findByEmail("sara@finco.ma")).thenReturn(Optional.of(courant));
        when(notificationRepository.countByDestinataireIdAndLuFalse(7L)).thenReturn(3L);

        assertEquals(3L, service.compterNonLues("sara@finco.ma"));
        verify(notificationRepository).countByDestinataireIdAndLuFalse(7L);
    }

    @Test
    void lister_neRenvoieQueLesNotificationsDeLUtilisateurCourant() {
        Utilisateur courant = utilisateur(7L);
        when(utilisateurRepository.findByEmail("sara@finco.ma")).thenReturn(Optional.of(courant));
        Notification item = notification(1L, courant, false);
        when(notificationRepository.findByDestinataireIdOrderByDateCreationDesc(eq(7L), any()))
                .thenReturn(new PageImpl<>(List.of(item), PageRequest.of(0, 20), 1));

        NotificationsPageResponse reponse = service.lister("sara@finco.ma", 0, 20, false);

        assertEquals(1, reponse.content().size());
        assertEquals(1L, reponse.totalElements());
        verify(notificationRepository).findByDestinataireIdOrderByDateCreationDesc(eq(7L), any());
        verify(notificationRepository, never())
                .findByDestinataireIdAndLuFalseOrderByDateCreationDesc(any(), any());
    }

    @Test
    void marquerLue_marqueLaNotificationDeLUtilisateurCourant() {
        Utilisateur courant = utilisateur(7L);
        when(utilisateurRepository.findByEmail("sara@finco.ma")).thenReturn(Optional.of(courant));
        Notification item = notification(1L, courant, false);
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(item));

        service.marquerLue(1L, "sara@finco.ma");

        assertTrue(item.isLu());
        verify(notificationRepository).save(item);
    }

    @Test
    void marquerLue_notificationDUnAutreUtilisateur_lanceAccesRefuse() {
        Utilisateur courant = utilisateur(7L);
        Utilisateur autre = utilisateur(8L);
        when(utilisateurRepository.findByEmail("sara@finco.ma")).thenReturn(Optional.of(courant));
        Notification item = notification(1L, autre, false);
        when(notificationRepository.findById(1L)).thenReturn(Optional.of(item));

        assertThrows(AccessDeniedException.class, () -> service.marquerLue(1L, "sara@finco.ma"));
        verify(notificationRepository, never()).save(any());
    }

    @Test
    void marquerLue_introuvable_lanceRessourceIntrouvable() {
        Utilisateur courant = utilisateur(7L);
        when(utilisateurRepository.findByEmail("sara@finco.ma")).thenReturn(Optional.of(courant));
        when(notificationRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(RessourceIntrouvableException.class, () -> service.marquerLue(99L, "sara@finco.ma"));
    }

    @Test
    void toutMarquerLu_delegueAuDepot() {
        Utilisateur courant = utilisateur(7L);
        when(utilisateurRepository.findByEmail("sara@finco.ma")).thenReturn(Optional.of(courant));
        when(notificationRepository.toutMarquerLu(7L)).thenReturn(2);

        assertEquals(2, service.toutMarquerLu("sara@finco.ma"));
        verify(notificationRepository).toutMarquerLu(7L);
    }

    @Test
    void creerPourRole_envoieATousLesUtilisateursActifs() {
        Utilisateur daf1 = utilisateur(1L);
        Utilisateur daf2 = utilisateur(2L);
        when(utilisateurRepository.findByRoleAndActifTrue(Role.DIRECTEUR_FINANCIER))
                .thenReturn(List.of(daf1, daf2));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        service.creerPourRole(Role.DIRECTEUR_FINANCIER, TypeNotification.PAIEMENT_A_VALIDER,
                SeveriteNotification.WARNING, "Un paiement attend.", "/validation-paiements", "PAIEMENT", 5L);

        verify(notificationRepository, times(2)).save(any(Notification.class));
    }
}
