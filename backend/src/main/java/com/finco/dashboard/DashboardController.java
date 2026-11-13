package com.finco.dashboard;

import com.finco.dashboard.dto.AdminDashboardDto;
import com.finco.dashboard.dto.ComptableDashboardDto;
import com.finco.dashboard.dto.ControleurDashboardDto;
import com.finco.dashboard.dto.DirecteurDashboardDto;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/comptable")
    @PreAuthorize("hasRole('COMPTABLE')")
    public ComptableDashboardDto comptable(@RequestParam(required = false) Long exerciceId,
                                           @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
                                           @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
                                           @RequestParam(required = false) Long centreId) {
        return dashboardService.comptable(exerciceId, dateFrom, dateTo, centreId);
    }

    @GetMapping("/controleur")
    @PreAuthorize("hasRole('CONTROLEUR')")
    public ControleurDashboardDto controleur(@RequestParam(required = false) Long exerciceId,
                                             @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
                                             @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
                                             @RequestParam(required = false) Long centreId) {
        return dashboardService.controleur(exerciceId, dateFrom, dateTo, centreId);
    }

    @GetMapping("/directeur")
    @PreAuthorize("hasRole('DIRECTEUR_FINANCIER')")
    public DirecteurDashboardDto directeur(@RequestParam(required = false) Long exerciceId,
                                           @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
                                           @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
                                           @RequestParam(required = false) Long centreId) {
        return dashboardService.directeur(exerciceId, dateFrom, dateTo, centreId);
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public AdminDashboardDto admin(@RequestParam(required = false) Long exerciceId,
                                   @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
                                   @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
                                   @RequestParam(required = false) Long centreId) {
        return dashboardService.admin(exerciceId, dateFrom, dateTo, centreId);
    }
}