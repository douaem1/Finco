package com.finco.service;

import com.finco.entity.CentreCout;
import com.finco.exception.ConflitMetierException;
import com.finco.exception.RegleMetierException;
import com.finco.repository.BudgetRepository;
import com.finco.repository.CentreCoutRepository;
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
class CentreCoutServiceTest {

    @Mock
    private CentreCoutRepository centreCoutRepository;

    @Mock
    private LigneEcritureRepository ligneEcritureRepository;

    @Mock
    private BudgetRepository budgetRepository;

    private CentreCoutService service;

    @BeforeEach
    void setup() {
        service = new CentreCoutService(centreCoutRepository, ligneEcritureRepository, budgetRepository);
    }

    @Test
    void creerCentre_succes() {
        CentreCout centre = new CentreCout("LOGIST", "Logistique centrale", true);
        when(centreCoutRepository.existsByCode("LOGIST")).thenReturn(false);
        when(centreCoutRepository.save(any(CentreCout.class))).thenAnswer(inv -> inv.getArgument(0));

        CentreCout res = service.create(centre);
        assertNotNull(res);
        assertEquals("LOGIST", res.getCode());
        assertEquals("Logistique centrale", res.getLibelle());
        assertTrue(res.isPrincipal());
    }

    @Test
    void creerCentre_codeInvalide_lanceErreur() {
        // Caractères minuscules ou spéciaux invalides
        CentreCout centre = new CentreCout("log-1", "Logistique", true);
        assertThrows(RegleMetierException.class, () -> service.create(centre));
    }

    @Test
    void creerCentre_codeDejaExistant_lanceConflit() {
        CentreCout centre = new CentreCout("PROD", "Production", true);
        when(centreCoutRepository.existsByCode("PROD")).thenReturn(true);

        assertThrows(ConflitMetierException.class, () -> service.create(centre));
        verify(centreCoutRepository, never()).save(any());
    }

    @Test
    void supprimerCentre_avecBudget_lanceConflit() {
        CentreCout centre = new CentreCout("BAT", "Bâtiments", false);
        centre.setId(15L);
        when(centreCoutRepository.findById(15L)).thenReturn(Optional.of(centre));
        when(ligneEcritureRepository.existsByCentreCoutId(15L)).thenReturn(false);
        when(budgetRepository.existsByCentreCoutId(15L)).thenReturn(true);

        assertThrows(ConflitMetierException.class, () -> service.delete(15L));
        verify(centreCoutRepository, never()).delete(any());
    }

    @Test
    void supprimerCentre_utiliseDansEcritures_lanceConflit() {
        CentreCout centre = new CentreCout("ADM", "Administration", false);
        centre.setId(16L);
        when(centreCoutRepository.findById(16L)).thenReturn(Optional.of(centre));
        when(ligneEcritureRepository.existsByCentreCoutId(16L)).thenReturn(true);

        assertThrows(ConflitMetierException.class, () -> service.delete(16L));
        verify(centreCoutRepository, never()).delete(any());
    }
}
