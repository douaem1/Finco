package com.finco.dashboard;

import com.finco.config.SecurityConfig;
import com.finco.dashboard.dto.ComptableDashboardDto;
import com.finco.security.JwtAuthFilter;
import com.finco.security.JwtService;
import com.finco.security.ReponsesSecuriteJson;
import com.finco.security.UtilisateurDetailsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DashboardController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, JwtService.class, ReponsesSecuriteJson.class})
class DashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DashboardService dashboardService;

    @MockBean
    private UtilisateurDetailsService utilisateurDetailsService;

    @Test
    void comptableAutoriseSonTableauDeBord() throws Exception {
        when(dashboardService.comptable(any(), any(), any(), any()))
                .thenReturn(new ComptableDashboardDto(2026, Map.of(), List.of(), Map.of()));

        mockMvc.perform(get("/api/dashboard/comptable").with(user("comptable").roles("COMPTABLE")))
                .andExpect(status().isOk());
    }

    @Test
    void comptableNePeutPasAccederAuTableauDuControleur() throws Exception {
        mockMvc.perform(get("/api/dashboard/controleur").with(user("comptable").roles("COMPTABLE")))
                .andExpect(status().isForbidden());
    }
}