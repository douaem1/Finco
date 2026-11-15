package com.finco.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Balance des comptes : lignes par compte, totaux généraux, équilibre. */
public record BalanceResponse(
        List<CompteBalance> comptes,
        BigDecimal totalDebit,
        BigDecimal totalCredit,
        boolean equilibree,
        LocalDate dateFrom,
        LocalDate dateTo) {
}
