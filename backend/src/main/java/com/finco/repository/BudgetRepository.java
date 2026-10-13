package com.finco.repository;

import com.finco.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {

    /** Vérifie si un centre de coûts a un budget associé avant suppression. */
    boolean existsByCentreCoutId(Long centreCoutId);

    /** Liste des budgets d'un centre de coûts, triés par année décroissante. */
    java.util.List<Budget> findByCentreCoutIdOrderByAnneeDesc(Long centreCoutId);

    /** Tous les budgets triés par centre puis par année. */
    java.util.List<Budget> findAllByOrderByCentreCoutCodeAscAnneeDesc();

    /** Unicité (centre, année) à la création. */
    boolean existsByCentreCoutIdAndAnnee(Long centreCoutId, int annee);

    /** Unicité (centre, année) à la modification — exclut le budget en cours. */
    boolean existsByCentreCoutIdAndAnneeAndIdNot(Long centreCoutId, int annee, Long id);
}
