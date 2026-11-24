package com.finco.dto;

import com.finco.entity.Imputation;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ImputationResponse(
        Long id,
        String periode,
        String codeSource,
        String libelleSource,
        String codeCible,
        String libelleCible,
        BigDecimal montant,
        LocalDateTime dateCalcul
) {
    public static ImputationResponse depuis(Imputation imputation) {
        return new ImputationResponse(
                imputation.getId(),
                imputation.getPeriode(),
                imputation.getCentreSource().getCode(),
                imputation.getCentreSource().getLibelle(),
                imputation.getCentreCible().getCode(),
                imputation.getCentreCible().getLibelle(),
                imputation.getMontant(),
                imputation.getDateCalcul());
    }
}
