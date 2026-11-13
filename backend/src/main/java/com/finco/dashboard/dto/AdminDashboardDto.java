package com.finco.dashboard.dto;

import java.util.Map;

public record AdminDashboardDto(int exercice, Map<String, DashboardKpi> kpis,
                                Map<String, Long> usersByRole) {
}