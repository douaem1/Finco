package com.finco.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record FactureRequest(
        String numero,
        LocalDate dateFacture,
        String type,
        BigDecimal montantHT,
        BigDecimal tauxTVA,
        Long tiersId
) {
}
