package com.finco.service;

import com.finco.dto.FournisseurRequest;
import com.finco.dto.FournisseurResponse;
import com.finco.entity.Fournisseur;
import com.finco.exception.ConflitMetierException;
import com.finco.exception.RegleMetierException;
import com.finco.repository.FactureRepository;
import com.finco.repository.FournisseurRepository;
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
class FournisseurServiceTest {

    @Mock
    private FournisseurRepository fournisseurRepository;

    @Mock
    private FactureRepository factureRepository;

    private FournisseurService service;

    @BeforeEach
    void setup() {
        service = new FournisseurService(fournisseurRepository, factureRepository);
    }

    @Test
    void creerFournisseur_succes() {
        FournisseurRequest req = new FournisseurRequest("Maroc Telecom", "001524368000085", "contact@iam.ma", "0537000000", "011780000012345678901234");
        Fournisseur saved = new Fournisseur("Maroc Telecom", "001524368000085", "contact@iam.ma", "0537000000", "011780000012345678901234");
        saved.setId(10L);

        when(fournisseurRepository.save(any(Fournisseur.class))).thenReturn(saved);

        FournisseurResponse res = service.create(req);
        assertNotNull(res);
        assertEquals(10L, res.id());
        assertEquals("Maroc Telecom", res.nom());
    }

    @Test
    void creerFournisseur_ribInvalide() {
        FournisseurRequest req = new FournisseurRequest("Fournisseur X", null, null, null, "12345");
        assertThrows(RegleMetierException.class, () -> service.create(req));
    }

    @Test
    void supprimerFournisseur_avecFactures_lanceConflit() {
        Fournisseur f = new Fournisseur("Fournisseur Avec Factures", null, null, null, null);
        f.setId(5L);
        when(fournisseurRepository.findById(5L)).thenReturn(Optional.of(f));
        when(factureRepository.existsByTiersId(5L)).thenReturn(true);

        assertThrows(ConflitMetierException.class, () -> service.delete(5L));
        verify(fournisseurRepository, never()).delete(any());
    }

    @Test
    void supprimerFournisseur_sansFactures_succes() {
        Fournisseur f = new Fournisseur("Fournisseur Sans Factures", null, null, null, null);
        f.setId(6L);
        when(fournisseurRepository.findById(6L)).thenReturn(Optional.of(f));
        when(factureRepository.existsByTiersId(6L)).thenReturn(false);

        service.delete(6L);
        verify(fournisseurRepository, times(1)).delete(f);
    }
}
