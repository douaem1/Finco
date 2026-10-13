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
        Fournisseur f = new Fournisseur();
        appliquer(f, request, null);
        Fournisseur enregistre = fournisseurRepository.save(f);
        return FournisseurResponse.de(enregistre);
    }

    public FournisseurResponse update(Long id, FournisseurRequest request) {
        Fournisseur f = getFournisseurOuErreur(id);
        appliquer(f, request, id);
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

    /**
     * Contrôle puis recopie les données saisies (règles dans ReglesTiers).
     * @param idExclu id du fournisseur modifié (null à la création), pour le contrôle d'unicité de l'ICE
     */
    private void appliquer(Fournisseur f, FournisseurRequest request, Long idExclu) {
        if (request == null) {
            throw new RegleMetierException("Aucune donnée reçue.");
        }
        String ice = ReglesTiers.ice(request.ice());
        if (ice != null && (idExclu == null ? fournisseurRepository.existsByIce(ice)
                : fournisseurRepository.existsByIceAndIdNot(ice, idExclu))) {
            throw new ConflitMetierException("ice", "Un fournisseur avec l'ICE « " + ice + " » existe déjà.");
        }
        f.setNom(ReglesTiers.nom(request.nom(), "fournisseur"));
        f.setIce(ice);
        f.setEmail(ReglesTiers.email(request.email()));
        f.setTelephone(ReglesTiers.telephone(request.telephone()));
        f.setRib(ReglesTiers.rib(request.rib()));
    }
}
