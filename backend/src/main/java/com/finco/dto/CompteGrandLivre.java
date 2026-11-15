package com.finco.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Grand livre d'un compte : solde d'ouverture, mouvements, totaux. */
public record CompteGrandLivre(
        String numero,
        String libelle,
        BigDecimal soldeOuverture,
        List<LigneGrandLivre> lignes,
        BigDecimal totalDebit,
        BigDecimal totalCredit,
        BigDecimal soldeFinal) {

    /** Une ligne de grand livre avec solde cumulé. */
    public record LigneGrandLivre(
            LocalDate date,
            String pieceNumero,
            Long pieceId,
            String libelle,
            String centreCode,
            BigDecimal debit,
            BigDecimal credit,
            BigDecimal soldeCumule) {
    }
}
