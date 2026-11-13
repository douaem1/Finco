package com.finco.dashboard.dto;

import java.math.BigDecimal;

public record DashboardCentre(Long id, String code, String label, BigDecimal budget,
                              BigDecimal actual, BigDecimal variance, BigDecimal consumptionPct) {
}