package com.finco.audit;

import com.finco.entity.Utilisateur;
import com.finco.entity.enums.Role;
import com.finco.repository.UtilisateurRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Tests du service d'audit : résolution automatique de l'utilisateur, de l'IP
 * et du requestId ; propagation ou non des erreurs ; masquage des emails.
 */
@ExtendWith(MockitoExtension.class)
class AuditServiceTest {

    @Mock
    private AuditRepository auditRepository;

    @Mock
    private UtilisateurRepository utilisateurRepository;

    private AuditService service;

    @BeforeEach
    void setup() {
        service = new AuditService(auditRepository, utilisateurRepository);
        MDC.put(ContexteRequete.CLE_MDC_REQUEST_ID, "req-test-123");
    }

    @AfterEach
    void nettoyage() {
        MDC.clear();
        SecurityContextHolder.clearContext();
        RequestContextHolder.resetRequestAttributes();
    }

    private void authentifier(String email, Role role) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(email, null, List.of()));
    }

    private void requete(String remoteAddr, String xForwardedFor) {
        MockHttpServletRequest requete = new MockHttpServletRequest();
        requete.setRemoteAddr(remoteAddr);
        if (xForwardedFor != null) {
            requete.addHeader("X-Forwarded-For", xForwardedFor);
        }
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(requete));
    }

    private Utilisateur utilisateur(Long id, String nom, Role role) {
        Utilisateur utilisateur = mock(Utilisateur.class);
        lenient().when(utilisateur.getId()).thenReturn(id);
        lenient().when(utilisateur.getNomComplet()).thenReturn(nom);
        lenient().when(utilisateur.getRole()).thenReturn(role);
        return utilisateur;
    }

    private ArgumentCaptor<AuditEvent> capturer() {
        return ArgumentCaptor.forClass(AuditEvent.class);
    }

    @Test
    void enregistrer_resoutUtilisateurIpEtRequestId() {
        Utilisateur sara = utilisateur(5L, "Sara Bennani", Role.COMPTABLE);
        when(utilisateurRepository.findByEmail("comptable@finco.ma")).thenReturn(Optional.of(sara));
        when(auditRepository.save(any(AuditEvent.class))).thenAnswer(inv -> inv.getArgument(0));
        authentifier("comptable@finco.ma", Role.COMPTABLE);
        requete("127.0.0.1", "203.0.113.7, 10.0.0.1");

        service.enregistrer(ActionAudit.PIECE_VALIDEE, "PIECE", 42L, "PC-2026-00042",
                null, null, "Validation de la pièce");

        ArgumentCaptor<AuditEvent> capteur = capturer();
        verify(auditRepository).save(capteur.capture());
        AuditEvent evenement = capteur.getValue();
        assertEquals(5L, evenement.getUtilisateurId());
        assertEquals("Sara Bennani", evenement.getUtilisateurNom());
        assertEquals("COMPTABLE", evenement.getUtilisateurRole());
        assertEquals("203.0.113.7", evenement.getAdresseIp());
        assertEquals("req-test-123", evenement.getRequestId());
        assertEquals(ResultatAudit.SUCCES, evenement.getResultat());
    }

    @Test
    void enregistrer_conserveReferenceEtValeurs() {
        Utilisateur sara = utilisateur(5L, "Sara Bennani", Role.COMPTABLE);
        when(utilisateurRepository.findByEmail("comptable@finco.ma")).thenReturn(Optional.of(sara));
        when(auditRepository.save(any(AuditEvent.class))).thenAnswer(inv -> inv.getArgument(0));
        authentifier("comptable@finco.ma", Role.COMPTABLE);

        service.enregistrer(ActionAudit.BUDGET_MODIFIE, "BUDGET", 9L, "Budget 2026 PROD",
                "{\"montant\":1000}", "{\"montant\":1200}", "Révision budgétaire");

        ArgumentCaptor<AuditEvent> capteur = capturer();
        verify(auditRepository).save(capteur.capture());
        AuditEvent evenement = capteur.getValue();
        assertEquals("BUDGET", evenement.getEntiteType());
        assertEquals(9L, evenement.getEntiteId());
        assertEquals("Budget 2026 PROD", evenement.getEntiteReference());
        assertEquals("{\"montant\":1000}", evenement.getAncienneValeur());
        assertEquals("{\"montant\":1200}", evenement.getNouvelleValeur());
        assertEquals("Révision budgétaire", evenement.getDetails());
    }

    @Test
    void enregistrer_tronqueLesDetails() {
        Utilisateur sara = utilisateur(5L, "Sara Bennani", Role.COMPTABLE);
        when(utilisateurRepository.findByEmail("comptable@finco.ma")).thenReturn(Optional.of(sara));
        when(auditRepository.save(any(AuditEvent.class))).thenAnswer(inv -> inv.getArgument(0));
        authentifier("comptable@finco.ma", Role.COMPTABLE);

        String details = "x".repeat(900);
        service.enregistrer(ActionAudit.PIECE_CREEE, "PIECE", 1L, "PC-2026-00001", null, null, details);

        ArgumentCaptor<AuditEvent> capteur = capturer();
        verify(auditRepository).save(capteur.capture());
        assertEquals(500, capteur.getValue().getDetails().length());
    }

    @Test
    void enregistrer_utilisateurInconnu_resteSansUtilisateur() {
        authentifier("inconnu@finco.ma", Role.COMPTABLE);
        when(utilisateurRepository.findByEmail("inconnu@finco.ma")).thenReturn(Optional.empty());
        when(auditRepository.save(any(AuditEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        service.enregistrer(ActionAudit.PIECE_CREEE, "PIECE", 1L, "PC-2026-00001", null, null, null);

        ArgumentCaptor<AuditEvent> capteur = capturer();
        verify(auditRepository).save(capteur.capture());
        assertNull(capteur.getValue().getUtilisateurId());
        assertNull(capteur.getValue().getUtilisateurNom());
    }

    @Test
    void enregistrer_erreurDEcriture_estPropAgee() {
        Utilisateur sara = utilisateur(5L, "Sara Bennani", Role.COMPTABLE);
        when(utilisateurRepository.findByEmail("comptable@finco.ma")).thenReturn(Optional.of(sara));
        when(auditRepository.save(any(AuditEvent.class))).thenThrow(new RuntimeException("panne BDD"));
        authentifier("comptable@finco.ma", Role.COMPTABLE);

        assertThrows(RuntimeException.class, () -> service.enregistrer(ActionAudit.PIECE_VALIDEE,
                "PIECE", 42L, "PC-2026-00042", null, null, null));
    }

    @Test
    void enregistrerConnexionEchouee_masqueLEmailInconnuEtSansUtilisateur() {
        when(utilisateurRepository.findByEmail("sara.bennani@finco.ma")).thenReturn(Optional.empty());
        when(auditRepository.save(any(AuditEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        service.enregistrerConnexionEchouee("Sara.Bennani@finco.ma");

        ArgumentCaptor<AuditEvent> capteur = capturer();
        verify(auditRepository).save(capteur.capture());
        AuditEvent evenement = capteur.getValue();
        assertEquals(ActionAudit.CONNEXION_ECHOUEE, evenement.getAction());
        assertEquals(ResultatAudit.ECHEC, evenement.getResultat());
        assertNull(evenement.getUtilisateurId());
        assertNull(evenement.getUtilisateurNom());
        assertEquals("s***i@finco.ma", evenement.getEntiteReference());
        assertTrue(evenement.getDetails().contains("s***i@finco.ma"));
        assertFalse(evenement.getDetails().contains("Sara.Bennani"));
    }

    @Test
    void enregistrerConnexionEchouee_compteExistant_gardeLEmail() {
        Utilisateur sara = utilisateur(5L, "Sara Bennani", Role.COMPTABLE);
        when(utilisateurRepository.findByEmail("comptable@finco.ma")).thenReturn(Optional.of(sara));
        when(auditRepository.save(any(AuditEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        service.enregistrerConnexionEchouee("comptable@finco.ma");

        ArgumentCaptor<AuditEvent> capteur = capturer();
        verify(auditRepository).save(capteur.capture());
        assertEquals("comptable@finco.ma", capteur.getValue().getEntiteReference());
        assertNull(capteur.getValue().getUtilisateurId());
    }

    @Test
    void enregistrerExport_avaleLErreur() {
        when(auditRepository.save(any(AuditEvent.class))).thenThrow(new RuntimeException("panne"));
        authentifier("comptable@finco.ma", Role.COMPTABLE);
        Utilisateur sara = utilisateur(5L, "Sara Bennani", Role.COMPTABLE);
        when(utilisateurRepository.findByEmail("comptable@finco.ma")).thenReturn(Optional.of(sara));

        assertDoesNotThrow(() -> service.enregistrerExport(ActionAudit.EXPORT_PDF,
                "GRAND_LIVRE", "Global", "Export PDF"));
    }
}
