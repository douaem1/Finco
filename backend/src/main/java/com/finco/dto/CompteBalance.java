package com.finco.dto;

import java.math.BigDecimal;

/** Ligne de balance des comptes (totaux débit / crédit et soldes). */
public record CompteBalance(
        String numero,
        String libelle,
        BigDecimal totalDebit,
        BigDecimal totalCredit,
        BigDecimal soldeDebiteur,
        BigDecimal soldeCrediteur) {
}
