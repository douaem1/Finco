package com.finco.dashboard.dto;

import java.util.List;
import java.util.Map;

public record DirecteurDashboardDto(int exercice, Map<String, DashboardKpi> kpis,
                                    List<DashboardMonthly> monthly, Map<String, Long> invoiceStatuses) {
}