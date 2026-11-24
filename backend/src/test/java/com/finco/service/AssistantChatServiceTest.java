package com.finco.service;

import com.finco.dto.AssistantChatRequest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class AssistantChatServiceTest {

    @Test
    void envoieLHistoriqueAuModeleGeminiEtRetourneSaReponse() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer serveur = MockRestServiceServer.bindTo(builder).build();
        AssistantChatService service = new AssistantChatService(builder, "cle-de-test", "gemini-3.8-flash");

        serveur.expect(requestTo(
                        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("x-goog-api-key", "cle-de-test"))
                .andExpect(jsonPath("$.contents[0].role").value("user"))
                .andExpect(jsonPath("$.contents[1].role").value("model"))
                .andExpect(jsonPath("$.contents[2].parts[0].text").value("Explique le débit."))
                .andExpect(jsonPath("$.systemInstruction.parts[0].text").exists())
                .andExpect(jsonPath("$.generationConfig.maxOutputTokens").value(600))
                .andRespond(withSuccess("""
                        {"candidates":[{"content":{"parts":[{"text":"Le débit enregistre un emploi."}]}}]}
                        """, MediaType.APPLICATION_JSON));

        String reponse = service.repondre(List.of(
                new AssistantChatRequest.Message("user", "Question précédente"),
                new AssistantChatRequest.Message("assistant", "Réponse précédente"),
                new AssistantChatRequest.Message("user", "Explique le débit.")));

        assertThat(reponse).isEqualTo("Le débit enregistre un emploi.");
        serveur.verify();
    }

    @Test
    void refuseDeContacterGeminiSansCleApi() {
        AssistantChatService service = new AssistantChatService(
                RestClient.builder(), "", "gemini-3.8-flash");

        assertThatThrownBy(() -> service.repondre(
                List.of(new AssistantChatRequest.Message("user", "Comment lire un budget ?"))))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("GEMINI_API_KEY");
    }

    @Test
    void exigeUnDernierMessageUtilisateur() {
        AssistantChatService service = new AssistantChatService(
                RestClient.builder(), "cle-de-test", "gemini-3.8-flash");

        assertThatThrownBy(() -> service.repondre(
                List.of(new AssistantChatRequest.Message("assistant", "Réponse isolée"))))
                .hasMessageContaining("conversation envoyée est invalide");
    }
}
