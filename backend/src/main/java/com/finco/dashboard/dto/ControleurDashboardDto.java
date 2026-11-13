package com.finco.dashboard.dto;

import java.util.List;
import java.util.Map;

public record ControleurDashboardDto(int exercice, Map<String, DashboardKpi> kpis,
                                     List<DashboardMonthly> monthly, List<DashboardCentre> centres) {
}