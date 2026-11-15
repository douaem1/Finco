package com.finco.notification;

import com.finco.entity.Utilisateur;
import com.finco.entity.enums.Role;
import com.finco.repository.UtilisateurRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationListenerTest {

    @Mock
    private NotificationService notificationService;

    @Mock
    private UtilisateurRepository utilisateurRepository;

    private NotificationListener listener;

    @BeforeEach
    void setup() {
        listener = new NotificationListener(notificationService, utilisateurRepository);
    }

    private Utilisateur utilisateur(Long id) {
        Utilisateur utilisateur = mock(Utilisateur.class);
        lenient().when(utilisateur.getId()).thenReturn(id);
        lenient().when(utilisateur.isActif()).thenReturn(true);
        return utilisateur;
    }

    @Test
    void creationPaiement_notifieTousLesDirecteursFinanciers() {
        Utilisateur daf = utilisateur(10L);
        when(utilisateurRepository.findByRoleAndActifTrue(Role.DIRECTEUR_FINANCIER)).thenReturn(List.of(daf));

        NotificationEvenement evenement = new NotificationEvenement(
                TypeNotification.PAIEMENT_A_VALIDER, SeveriteNotification.WARNING,
                "Un paiement de 1000.00 MAD attend votre validation.", "/validation-paiements",
                "PAIEMENT", 42L, null,
                List.of(NotificationEvenement.Cible.role(Role.DIRECTEUR_FINANCIER)));

        listener.surEvenement(evenement);

        verify(notificationService).creerPourUtilisateur(eq(daf), eq(TypeNotification.PAIEMENT_A_VALIDER),
                eq(SeveriteNotification.WARNING), eq("Un paiement de 1000.00 MAD attend votre validation."),
                eq("/validation-paiements"), eq("PAIEMENT"), eq(42L));
    }

    @Test
    void erreurDeNotification_neRemonteJamais() {
        Utilisateur daf = utilisateur(10L);
        when(utilisateurRepository.findByRoleAndActifTrue(Role.DIRECTEUR_FINANCIER)).thenReturn(List.of(daf));
        when(notificationService.creerPourUtilisateur(any(), any(), any(), any(), any(), any(), any()))
                .thenThrow(new RuntimeException("panne"));

        NotificationEvenement evenement = new NotificationEvenement(
                TypeNotification.PAIEMENT_A_VALIDER, SeveriteNotification.WARNING,
                "message", "/validation-paiements", "PAIEMENT", 42L, null,
                List.of(NotificationEvenement.Cible.role(Role.DIRECTEUR_FINANCIER)));

        assertDoesNotThrow(() -> listener.surEvenement(evenement));
    }

    @Test
    void aucuneAutoNotification_pourLActeur() {
        Utilisateur comptable = utilisateur(5L);
        when(utilisateurRepository.findByRoleAndActifTrue(Role.COMPTABLE)).thenReturn(List.of(comptable));

        NotificationEvenement evenement = new NotificationEvenement(
                TypeNotification.PAIEMENT_VALIDE, SeveriteNotification.INFO,
                "message", "/paiements", "PAIEMENT", 1L, 5L,
                List.of(NotificationEvenement.Cible.role(Role.COMPTABLE)));

        listener.surEvenement(evenement);

        verify(notificationService, never())
                .creerPourUtilisateur(any(), any(), any(), any(), any(), any(), any());
    }
}
