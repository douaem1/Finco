package com.finco.controller;

import com.finco.config.SecurityConfig;
import com.finco.security.JwtAuthFilter;
import com.finco.security.JwtService;
import com.finco.security.ReponsesSecuriteJson;
import com.finco.security.UtilisateurDetailsService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Test de la couche web seule (@WebMvcTest) avec la vraie configuration de sécurité.
 * Le service qui lit la base (UtilisateurDetailsService) est remplacé par un « mock ».
 */
@WebMvcTest(TestController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, JwtService.class, ReponsesSecuriteJson.class})
class TestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UtilisateurDetailsService utilisateurDetailsService;

    @Test
    void testEndpointReturnsBackendStatus() throws Exception {
        mockMvc.perform(get("/api/test"))
                .andExpect(status().isOk())
                .andExpect(content().string("Backend Spring Boot opérationnel"));
    }

    @Test
    void routeProtegeeSansJetonRenvoie401EnJson() throws Exception {
        mockMvc.perform(get("/api/pieces"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").exists());
    }

    @Test
    void preflightAutoriseLeFrontendFinCoSurLePort5174() throws Exception {
        mockMvc.perform(options("/api/test")
                        .header(HttpHeaders.ORIGIN, "http://localhost:5174")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:5174"));
    }
}
