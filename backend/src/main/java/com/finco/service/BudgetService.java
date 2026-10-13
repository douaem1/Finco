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
import com.finco.repository.ExerciceRepository;
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
    private final ExerciceRepository exerciceRepository;

    public BudgetService(BudgetRepository budgetRepository,
                         CentreCoutRepository centreCoutRepository,
                         ExerciceRepository exerciceRepository) {
        this.budgetRepository = budgetRepository;
        this.centreCoutRepository = centreCoutRepository;
        this.exerciceRepository = exerciceRepository;
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
        CentreCout centre = valider(req);
        verifierExerciceOuvert(req.annee());
        if (budgetRepository.existsByCentreCoutIdAndAnnee(req.centreCoutId(), req.annee())) {
            throw new ConflitMetierException("annee",
                    "Un budget pour le centre « " + centre.getCode()
                            + " » et l'année « " + req.annee() + " » existe déjà.");
        }
        Budget b = new Budget(req.annee(), req.montantPrevu().setScale(2), centre);
        return BudgetResponse.de(budgetRepository.save(b));
    }

    public BudgetResponse update(Long id, BudgetRequest req) {
        Budget b = getOuErreur(id);
        verifierExerciceOuvert(b.getAnnee());          // l'ancien budget ne doit pas être figé
        CentreCout centre = valider(req);
        verifierExerciceOuvert(req.annee());           // ni la nouvelle année visée
        if (budgetRepository.existsByCentreCoutIdAndAnneeAndIdNot(req.centreCoutId(), req.annee(), id)) {
            throw new ConflitMetierException("annee",
                    "Un budget pour le centre « " + centre.getCode()
                            + " » et l'année « " + req.annee() + " » existe déjà.");
        }
        b.setAnnee(req.annee());
        b.setMontantPrevu(req.montantPrevu().setScale(2));
        b.setCentreCout(centre);
        return BudgetResponse.de(budgetRepository.save(b));
    }

    public void delete(Long id) {
        Budget b = getOuErreur(id);
        verifierExerciceOuvert(b.getAnnee());
        budgetRepository.delete(b);
    }

    // ---------------------------------------------------------------- helpers

    private Budget getOuErreur(Long id) {
        return budgetRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException(
                        "Budget introuvable (id = " + id + ")."));
    }

    /**
     * Règles de saisie d'un budget :
     *  - centre de coûts obligatoire et existant ;
     *  - année obligatoire (2000-2099) ;
     *  - montant prévu obligatoire, >= 0, 2 décimales max, 13 chiffres avant la virgule max.
     */
    private CentreCout valider(BudgetRequest req) {
        if (req == null) {
            throw new RegleMetierException("Aucune donnée reçue.");
        }
        if (req.centreCoutId() == null) {
            throw new RegleMetierException("centreCoutId", "Le centre de coûts est obligatoire.");
        }
        CentreCout centre = centreCoutRepository.findById(req.centreCoutId())
                .orElseThrow(() -> new RegleMetierException("centreCoutId", "Centre de coûts introuvable."));
        if (req.annee() == null || req.annee() < 2000 || req.annee() > 2099) {
            throw new RegleMetierException("annee", "L'année doit être comprise entre 2000 et 2099.");
        }
        BigDecimal montant = req.montantPrevu();
        if (montant == null) {
            throw new RegleMetierException("montantPrevu", "Le montant prévu est obligatoire.");
        }
        if (montant.signum() < 0) {
            throw new RegleMetierException("montantPrevu", "Le montant prévu doit être supérieur ou égal à zéro.");
        }
        ReglesMontant.verifierFormat(montant, "montantPrevu", "Le montant prévu");
        return centre;
    }

    /** Le budget d'une année dont l'exercice est clôturé est figé (comparaison réel / budget définitive). */
    private void verifierExerciceOuvert(int annee) {
        exerciceRepository.findByAnnee(annee).ifPresent(ex -> {
            if (ex.isCloture()) {
                throw new RegleMetierException("annee",
                        "L'exercice " + annee + " est clôturé : son budget ne peut plus être modifié.");
            }
        });
    }

    private CentreCout getCentreOuErreur(Long centreCoutId) {
        return centreCoutRepository.findById(centreCoutId)
                .orElseThrow(() -> new RessourceIntrouvableException(
                        "Centre de coûts introuvable (id = " + centreCoutId + ")."));
    }
}
