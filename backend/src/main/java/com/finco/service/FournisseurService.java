package com.finco.service;

import com.finco.dto.FournisseurRequest;
import com.finco.dto.FournisseurResponse;
import com.finco.entity.Fournisseur;
import com.finco.exception.ConflitMetierException;
import com.finco.exception.RegleMetierException;
import com.finco.exception.RessourceIntrouvableException;
import com.finco.repository.FactureRepository;
import com.finco.repository.FournisseurRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class FournisseurService {

    private final FournisseurRepository fournisseurRepository;
    private final FactureRepository factureRepository;

    public FournisseurService(FournisseurRepository fournisseurRepository, FactureRepository factureRepository) {
        this.fournisseurRepository = fournisseurRepository;
        this.factureRepository = factureRepository;
    }

    @Transactional(readOnly = true)
    public List<FournisseurResponse> findAll() {
        return fournisseurRepository.findAllByOrderByNomAsc().stream()
                .map(FournisseurResponse::de)
                .toList();
    }

    @Transactional(readOnly = true)
    public FournisseurResponse findById(Long id) {
        return FournisseurResponse.de(getFournisseurOuErreur(id));
    }

    public FournisseurResponse create(FournisseurRequest request) {
        validerDonnees(request);
        Fournisseur f = new Fournisseur();
        f.setNom(request.nom().trim());
        f.setIce(nettoyer(request.ice()));
        f.setEmail(nettoyer(request.email()));
        f.setTelephone(nettoyer(request.telephone()));
        f.setRib(nettoyer(request.rib()));

        Fournisseur enregistre = fournisseurRepository.save(f);
        return FournisseurResponse.de(enregistre);
    }

    public FournisseurResponse update(Long id, FournisseurRequest request) {
        Fournisseur f = getFournisseurOuErreur(id);
        validerDonnees(request);

        f.setNom(request.nom().trim());
        f.setIce(nettoyer(request.ice()));
        f.setEmail(nettoyer(request.email()));
        f.setTelephone(nettoyer(request.telephone()));
        f.setRib(nettoyer(request.rib()));

        Fournisseur misAJour = fournisseurRepository.save(f);
        return FournisseurResponse.de(misAJour);
    }

    public void delete(Long id) {
        Fournisseur f = getFournisseurOuErreur(id);
        if (factureRepository.existsByTiersId(id)) {
            throw new ConflitMetierException("Le fournisseur « " + f.getNom()
                    + " » possède des factures associées : suppression impossible.");
        }
        fournisseurRepository.delete(f);
    }

    private Fournisseur getFournisseurOuErreur(Long id) {
        return fournisseurRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Fournisseur introuvable (id = " + id + ")."));
    }

    private void validerDonnees(FournisseurRequest request) {
        if (request == null || request.nom() == null || request.nom().isBlank()) {
            throw new RegleMetierException("Le nom du fournisseur est obligatoire.");
        }
        if (request.nom().trim().length() > 150) {
            throw new RegleMetierException("Le nom ne doit pas dépasser 150 caractères.");
        }
        if (request.rib() != null && !request.rib().isBlank()) {
            String rib = request.rib().trim();
            if (!rib.matches("^[0-9]{24}$")) {
                throw new RegleMetierException("Le RIB doit comporter exactement 24 chiffres.");
            }
        }
    }

    private String nettoyer(String valeur) {
        if (valeur == null || valeur.isBlank()) {
            return null;
        }
        return valeur.trim();
    }
}
