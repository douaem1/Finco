package com.finco.dashboard.dto;

import java.math.BigDecimal;

public record DashboardKpi(BigDecimal value, BigDecimal previousValue, BigDecimal variationPct) {
}