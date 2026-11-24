package com.finco.dto;

import java.math.BigDecimal;

public record AllocationPaiementRequest(Long factureId, BigDecimal montantAffecte) {
}
