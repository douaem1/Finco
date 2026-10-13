package com.finco.service;

import com.finco.dto.ClientRequest;
import com.finco.dto.ClientResponse;
import com.finco.entity.Client;
import com.finco.exception.ConflitMetierException;
import com.finco.exception.RegleMetierException;
import com.finco.repository.ClientRepository;
import com.finco.repository.FactureRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClientServiceTest {

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private FactureRepository factureRepository;

    private ClientService service;

    @BeforeEach
    void setup() {
        service = new ClientService(clientRepository, factureRepository);
    }

    @Test
    void creerClient_succes() {
        ClientRequest req = new ClientRequest("OCP SA", "000012345678901", "finance@ocp.ma", "0522000000", new BigDecimal("500000.00"));
        Client saved = new Client("OCP SA", "000012345678901", "finance@ocp.ma", "0522000000", new BigDecimal("500000.00"));
        saved.setId(20L);

        when(clientRepository.save(any(Client.class))).thenReturn(saved);

        ClientResponse res = service.create(req);
        assertNotNull(res);
        assertEquals(20L, res.id());
        assertEquals("OCP SA", res.nom());
        assertEquals(new BigDecimal("500000.00"), res.plafondCredit());
    }

    @Test
    void creerClient_plafondNegatif_lanceErreur() {
        ClientRequest req = new ClientRequest("Client Deficit", null, null, null, new BigDecimal("-100.00"));
        assertThrows(RegleMetierException.class, () -> service.create(req));
    }

    @Test
    void supprimerClient_avecFactures_lanceConflit() {
        Client c = new Client("Client Déjà Facturé", null, null, null, BigDecimal.ZERO);
        c.setId(12L);
        when(clientRepository.findById(12L)).thenReturn(Optional.of(c));
        when(factureRepository.existsByTiersId(12L)).thenReturn(true);

        assertThrows(ConflitMetierException.class, () -> service.delete(12L));
        verify(clientRepository, never()).delete(any());
    }
}
