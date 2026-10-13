package com.finco.service;

import com.finco.dto.ClientRequest;
import com.finco.dto.ClientResponse;
import com.finco.entity.Client;
import com.finco.exception.ConflitMetierException;
import com.finco.exception.RegleMetierException;
import com.finco.exception.RessourceIntrouvableException;
import com.finco.repository.ClientRepository;
import com.finco.repository.FactureRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class ClientService {

    private final ClientRepository clientRepository;
    private final FactureRepository factureRepository;

    public ClientService(ClientRepository clientRepository, FactureRepository factureRepository) {
        this.clientRepository = clientRepository;
        this.factureRepository = factureRepository;
    }

    @Transactional(readOnly = true)
    public List<ClientResponse> findAll() {
        return clientRepository.findAllByOrderByNomAsc().stream()
                .map(ClientResponse::de)
                .toList();
    }

    @Transactional(readOnly = true)
    public ClientResponse findById(Long id) {
        return ClientResponse.de(getClientOuErreur(id));
    }

    public ClientResponse create(ClientRequest request) {
        Client c = new Client();
        appliquer(c, request, null);
        Client enregistre = clientRepository.save(c);
        return ClientResponse.de(enregistre);
    }

    public ClientResponse update(Long id, ClientRequest request) {
        Client c = getClientOuErreur(id);
        appliquer(c, request, id);
        Client misAJour = clientRepository.save(c);
        return ClientResponse.de(misAJour);
    }

    public void delete(Long id) {
        Client c = getClientOuErreur(id);
        if (factureRepository.existsByTiersId(id)) {
            throw new ConflitMetierException("Le client « " + c.getNom()
                    + " » possède des factures associées : suppression impossible.");
        }
        clientRepository.delete(c);
    }

    private Client getClientOuErreur(Long id) {
        return clientRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Client introuvable (id = " + id + ")."));
    }

    /**
     * Contrôle puis recopie les données saisies (règles dans ReglesTiers).
     * @param idExclu id du client modifié (null à la création), pour le contrôle d'unicité de l'ICE
     */
    private void appliquer(Client c, ClientRequest request, Long idExclu) {
        if (request == null) {
            throw new RegleMetierException("Aucune donnée reçue.");
        }
        String ice = ReglesTiers.ice(request.ice());
        if (ice != null && (idExclu == null ? clientRepository.existsByIce(ice)
                : clientRepository.existsByIceAndIdNot(ice, idExclu))) {
            throw new ConflitMetierException("ice", "Un client avec l'ICE « " + ice + " » existe déjà.");
        }
        c.setNom(ReglesTiers.nom(request.nom(), "client"));
        c.setIce(ice);
        c.setEmail(ReglesTiers.email(request.email()));
        c.setTelephone(ReglesTiers.telephone(request.telephone()));
        c.setPlafondCredit(ReglesTiers.plafondCredit(request.plafondCredit()));
    }
}
