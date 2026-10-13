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
        validerDonnees(request);
        Client c = new Client();
        c.setNom(request.nom().trim());
        c.setIce(nettoyer(request.ice()));
        c.setEmail(nettoyer(request.email()));
        c.setTelephone(nettoyer(request.telephone()));
        c.setPlafondCredit(request.plafondCredit() != null ? request.plafondCredit() : BigDecimal.ZERO);

        Client enregistre = clientRepository.save(c);
        return ClientResponse.de(enregistre);
    }

    public ClientResponse update(Long id, ClientRequest request) {
        Client c = getClientOuErreur(id);
        validerDonnees(request);

        c.setNom(request.nom().trim());
        c.setIce(nettoyer(request.ice()));
        c.setEmail(nettoyer(request.email()));
        c.setTelephone(nettoyer(request.telephone()));
        c.setPlafondCredit(request.plafondCredit() != null ? request.plafondCredit() : BigDecimal.ZERO);

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

    private void validerDonnees(ClientRequest request) {
        if (request == null || request.nom() == null || request.nom().isBlank()) {
            throw new RegleMetierException("Le nom du client est obligatoire.");
        }
        if (request.nom().trim().length() > 150) {
            throw new RegleMetierException("Le nom ne doit pas dépasser 150 caractères.");
        }
        if (request.plafondCredit() != null && request.plafondCredit().compareTo(BigDecimal.ZERO) < 0) {
            throw new RegleMetierException("Le plafond de crédit doit être supérieur ou égal à zéro.");
        }
    }

    private String nettoyer(String valeur) {
        if (valeur == null || valeur.isBlank()) {
            return null;
        }
        return valeur.trim();
    }
}
