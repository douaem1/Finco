package com.finco.dto;

import com.finco.entity.Budget;

import java.math.BigDecimal;

public record BudgetResponse(
        Long id,
        int annee,
        BigDecimal montantPrevu,
        Long centreCoutId,
        String codeCenter,
        String libelleCenter
) {
    /** Fabrique un BudgetResponse à partir d'une entité Budget. */
    public static BudgetResponse de(Budget b) {
        return new BudgetResponse(
                b.getId(),
                b.getAnnee(),
                b.getMontantPrevu(),
                b.getCentreCout() != null ? b.getCentreCout().getId() : null,
                b.getCentreCout() != null ? b.getCentreCout().getCode() : null,
                b.getCentreCout() != null ? b.getCentreCout().getLibelle() : null
        );
    }
}
