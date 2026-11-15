package com.finco.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Grand livre complet (un ou plusieurs comptes) avec totaux généraux. */
public record GrandLivreResponse(
        List<CompteGrandLivre> comptes,
        BigDecimal totalDebit,
        BigDecimal totalCredit,
        LocalDate dateFrom,
        LocalDate dateTo) {
}
