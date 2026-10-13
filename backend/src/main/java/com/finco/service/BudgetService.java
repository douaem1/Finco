package com.finco.service;

import com.finco.dto.BudgetRequest;
import com.finco.dto.BudgetResponse;
import com.finco.entity.Budget;
import com.finco.entity.CentreCout;
import com.finco.exception.ConflitMetierException;
import com.finco.exception.RegleMetierException;
import com.finco.exception.RessourceIntrouvableException;
import com.finco.repository.BudgetRepository;
import com.finco.repository.CentreCoutRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Couche métier des budgets CO.
 * Règles :
 * - (centre_cout_id, annee) est unique.
 * - Le montant prévu doit être ≥ 0.
 */
@Service
@Transactional
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final CentreCoutRepository centreCoutRepository;

    public BudgetService(BudgetRepository budgetRepository,
                         CentreCoutRepository centreCoutRepository) {
        this.budgetRepository = budgetRepository;
        this.centreCoutRepository = centreCoutRepository;
    }

    @Transactional(readOnly = true)
    public List<BudgetResponse> findAll() {
        return budgetRepository.findAllByOrderByCentreCoutCodeAscAnneeDesc().stream()
                .map(BudgetResponse::de)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BudgetResponse> findByCentreCout(Long centreCoutId) {
        // Vérification existence du centre
        if (!centreCoutRepository.existsById(centreCoutId)) {
            throw new RessourceIntrouvableException(
                    "Centre de coûts introuvable (id = " + centreCoutId + ").");
        }
        return budgetRepository.findByCentreCoutIdOrderByAnneeDesc(centreCoutId).stream()
                .map(BudgetResponse::de)
                .toList();
    }

    @Transactional(readOnly = true)
    public BudgetResponse findById(Long id) {
        return BudgetResponse.de(getOuErreur(id));
    }

    public BudgetResponse create(BudgetRequest req) {
        validerMontant(req.montantPrevu());
        CentreCout centre = getCentreOuErreur(req.centreCoutId());

        if (budgetRepository.existsByCentreCoutIdAndAnnee(req.centreCoutId(), req.annee())) {
            throw new ConflitMetierException(
                    "Un budget pour le centre « " + centre.getCode()
                            + " » et l'année « " + req.annee() + " » existe déjà.");
        }

        Budget b = new Budget(req.annee(), req.montantPrevu(), centre);
        return BudgetResponse.de(budgetRepository.save(b));
    }

    public BudgetResponse update(Long id, BudgetRequest req) {
        Budget b = getOuErreur(id);
        validerMontant(req.montantPrevu());
        CentreCout centre = getCentreOuErreur(req.centreCoutId());

        if (budgetRepository.existsByCentreCoutIdAndAnneeAndIdNot(req.centreCoutId(), req.annee(), id)) {
            throw new ConflitMetierException(
                    "Un budget pour le centre « " + centre.getCode()
                            + " » et l'année « " + req.annee() + " » existe déjà.");
        }

        b.setAnnee(req.annee());
        b.setMontantPrevu(req.montantPrevu());
        b.setCentreCout(centre);
        return BudgetResponse.de(budgetRepository.save(b));
    }

    public void delete(Long id) {
        Budget b = getOuErreur(id);
        budgetRepository.delete(b);
    }

    // ---------------------------------------------------------------- helpers

    private Budget getOuErreur(Long id) {
        return budgetRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException(
                        "Budget introuvable (id = " + id + ")."));
    }

    private CentreCout getCentreOuErreur(Long centreCoutId) {
        return centreCoutRepository.findById(centreCoutId)
                .orElseThrow(() -> new RessourceIntrouvableException(
                        "Centre de coûts introuvable (id = " + centreCoutId + ")."));
    }

    private void validerMontant(BigDecimal montant) {
        if (montant != null && montant.compareTo(BigDecimal.ZERO) < 0) {
            throw new RegleMetierException("Le montant prévu doit être supérieur ou égal à zéro.");
        }
    }
}
