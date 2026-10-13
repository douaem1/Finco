package com.finco.service;

import com.finco.dto.CompteGeneralRequest;
import com.finco.dto.CompteGeneralResponse;
import com.finco.entity.CompteGeneral;
import com.finco.exception.ConflitMetierException;
import com.finco.exception.RegleMetierException;
import com.finco.repository.CompteGeneralRepository;
import com.finco.repository.LigneEcritureRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CompteGeneralServiceTest {

    @Mock
    private CompteGeneralRepository compteGeneralRepository;

    @Mock
    private LigneEcritureRepository ligneEcritureRepository;

    private CompteGeneralService service;

    @BeforeEach
    void setup() {
        service = new CompteGeneralService(compteGeneralRepository, ligneEcritureRepository);
    }

    @Test
    void creerCompte_succes_etCalculClasse() {
        CompteGeneralRequest req = new CompteGeneralRequest("6141", "Transports du personnel");
        CompteGeneral saved = new CompteGeneral("6141", "Transports du personnel", 6);
        saved.setId(100L);

        when(compteGeneralRepository.existsByNumero("6141")).thenReturn(false);
        when(compteGeneralRepository.save(any(CompteGeneral.class))).thenReturn(saved);

        CompteGeneralResponse res = service.create(req);
        assertNotNull(res);
        assertEquals("6141", res.numero());
        assertEquals(6, res.classe());
    }

    @Test
    void creerCompte_numeroInvalide_lanceErreur() {
        // Commence par 9 (hors 1-8)
        CompteGeneralRequest req = new CompteGeneralRequest("9100", "Compte Hors Plan");
        assertThrows(RegleMetierException.class, () -> service.create(req));
    }

    @Test
    void creerCompte_numeroDejaExistant_lanceConflit() {
        CompteGeneralRequest req = new CompteGeneralRequest("6111", "Achats");
        when(compteGeneralRepository.existsByNumero("6111")).thenReturn(true);

        assertThrows(ConflitMetierException.class, () -> service.create(req));
        verify(compteGeneralRepository, never()).save(any());
    }

    @Test
    void modifierCompte_utiliseDansEcriture_interditChangementNumero() {
        CompteGeneral c = new CompteGeneral("6111", "Achats", 6);
        c.setId(50L);

        when(compteGeneralRepository.findById(50L)).thenReturn(Optional.of(c));
        when(ligneEcritureRepository.existsByCompteId(50L)).thenReturn(true);

        CompteGeneralRequest req = new CompteGeneralRequest("6112", "Nouveau libelle");
        assertThrows(ConflitMetierException.class, () -> service.update(50L, req));
    }

    @Test
    void supprimerCompte_utiliseDansEcriture_lanceConflit() {
        CompteGeneral c = new CompteGeneral("4411", "Fournisseurs", 4);
        c.setId(30L);

        when(compteGeneralRepository.findById(30L)).thenReturn(Optional.of(c));
        when(ligneEcritureRepository.existsByCompteId(30L)).thenReturn(true);

        assertThrows(ConflitMetierException.class, () -> service.delete(30L));
        verify(compteGeneralRepository, never()).delete(any());
    }
}
