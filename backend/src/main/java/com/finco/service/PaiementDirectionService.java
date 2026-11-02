package com.finco.service;

import com.finco.dto.PaiementDirectionResponse;
import com.finco.entity.AllocationPaiement;
import com.finco.entity.Paiement;
import com.finco.entity.Utilisateur;
import com.finco.entity.enums.StatutFacture;
import com.finco.exception.RessourceIntrouvableException;
import com.finco.repository.AllocationPaiementRepository;
import com.finco.repository.PaiementRepository;
import com.finco.repository.UtilisateurRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class PaiementDirectionService {
    private final PaiementRepository paiementRepository;
    private final AllocationPaiementRepository allocationRepository;
    private final UtilisateurRepository utilisateurRepository;

    public PaiementDirectionService(PaiementRepository paiementRepository,
                                    AllocationPaiementRepository allocationRepository,
                                    UtilisateurRepository utilisateurRepository) {
        this.paiementRepository = paiementRepository;
        this.allocationRepository = allocationRepository;
        this.utilisateurRepository = utilisateurRepository;
    }

    @Transactional(readOnly = true)
    public List<PaiementDirectionResponse> lister() {
        return paiementRepository.findAllByOrderByDatePaiementDescIdDesc().stream()
                .map(p -> PaiementDirectionResponse.depuis(p, allocations(p)))
                .toList();
    }

    public PaiementDirectionResponse valider(Long id, String email) {
        Paiement paiement = paiementRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Paiement introuvable (id = " + id + ")."));
        if (paiement.getValidePar() == null) {
            Utilisateur valideur = utilisateurRepository.findByEmail(email)
                    .orElseThrow(() -> new RessourceIntrouvableException("Valideur introuvable."));
            paiement.setValidePar(valideur);
            allocations(paiement).forEach(a -> a.getFacture().setStatut(StatutFacture.PAYEE));
            paiementRepository.save(paiement);
        }
        return PaiementDirectionResponse.depuis(paiement, allocations(paiement));
    }

    private List<AllocationPaiement> allocations(Paiement paiement) {
        return allocationRepository.findAllByPaiementIdWithFacture(paiement.getId());
    }
}
