package com.finco.audit;

import com.finco.config.SecurityConfig;
import com.finco.pdf.ContextePdf;
import com.finco.pdf.PdfService;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Accès au journal d'audit : ADMIN uniquement. Les autres rôles reçoivent 403.
 */
@WebMvcTest(AuditController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, JwtService.class, ReponsesSecuriteJson.class})
class AuditControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuditService auditService;

    @MockBean
    private PdfService pdfService;

    @MockBean
    private ContextePdf contextePdf;

    @MockBean
    private UtilisateurDetailsService utilisateurDetailsService;

    @Test
    void adminPeutConsulterLeJournal() throws Exception {
        when(auditService.rechercher(any(), any()))
                .thenReturn(new AuditPageResponse(List.of(), 0, 0));

        mockMvc.perform(get("/api/admin/audit").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk());
    }

    @Test
    void comptableNePeutPasAccederAuJournal() throws Exception {
        mockMvc.perform(get("/api/admin/audit").with(user("comptable").roles("COMPTABLE")))
                .andExpect(status().isForbidden());
    }

    @Test
    void controleurNePeutPasAccederAuJournal() throws Exception {
        mockMvc.perform(get("/api/admin/audit").with(user("controleur").roles("CONTROLEUR")))
                .andExpect(status().isForbidden());
    }

    @Test
    void directeurFinancierNePeutPasAccederAuJournal() throws Exception {
        mockMvc.perform(get("/api/admin/audit").with(user("daf").roles("DIRECTEUR_FINANCIER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void lesExportsSontEgalementReservesAlAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/audit/export/pdf").with(user("comptable").roles("COMPTABLE")))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/audit/export/csv").with(user("daf").roles("DIRECTEUR_FINANCIER")))
                .andExpect(status().isForbidden());
    }
}
