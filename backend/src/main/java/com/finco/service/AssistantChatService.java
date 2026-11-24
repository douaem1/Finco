package com.finco.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.finco.dto.AssistantChatRequest;
import com.finco.exception.RegleMetierException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class AssistantChatService {

    private static final Logger log = LoggerFactory.getLogger(AssistantChatService.class);
    private static final int HISTORIQUE_MAX = 8;
    private static final int MESSAGE_MAX = 1600;
    private static final String SYSTEM_INSTRUCTION = """
            Tu es l'assistant pédagogique de FinCo, destiné aux employés.
            Réponds en français, clairement et avec concision, sur la comptabilité générale (notamment les principes CGNC), les écritures, les budgets et les centres de coûts.
            Explique les notions et les étapes générales de FinCo, mais n'invente jamais une règle comptable ou une procédure interne. Si une réponse dépend d'une règle officielle ou d'un paramétrage interne, signale-le et recommande une vérification auprès du responsable comptable.
            Tu n'as accès à aucune donnée de l'application FinCo. Ne prétends jamais connaître des factures, écritures, soldes, budgets ou informations d'employés.
            Ne demande pas de noms, de coordonnées, de numéros de compte bancaire ni de données financières confidentielles. Si l'utilisateur fournit de telles données, conseille-lui de les retirer et réponds seulement à partir d'un exemple anonymisé.
            Ne réalise aucune action dans FinCo et ne donne pas de conseil d'investissement ou de décision financière.
            """;
    private static final String ENDPOINT =
            "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent";

    private final RestClient.Builder restClientBuilder;
    private final String apiKey;
    private final String model;

    public AssistantChatService(RestClient.Builder restClientBuilder,
                               @Value("${app.chatbot.gemini.api-key:}") String apiKey,
                               @Value("${app.chatbot.gemini.model:gemini-3.8-flash}") String model) {
        this.restClientBuilder = restClientBuilder;
        this.apiKey = apiKey;
        this.model = model;
    }

    public String repondre(List<AssistantChatRequest.Message> messages) {
        verifierConversation(messages);
        if (apiKey == null || apiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "L’assistant IA n’est pas configuré. Définissez GEMINI_API_KEY côté serveur.");
        }

        GeminiRequest request = new GeminiRequest(
                messages.stream()
                        .map(message -> new GeminiContent(
                                message.role().equals("assistant") ? "model" : "user",
                                List.of(new GeminiPart(message.content()))))
                        .toList(),
                new GeminiSystemInstruction(List.of(new GeminiPart(SYSTEM_INSTRUCTION))),
                new GeminiGenerationConfig(600));

        try {
            JsonNode response = restClientBuilder.build()
                    .post()
                    .uri(ENDPOINT, model)
                    .header("x-goog-api-key", apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(JsonNode.class);
            return extraireReponse(response);
        } catch (RestClientResponseException e) {
            log.error("Gemini a répondu avec le statut HTTP {}.", e.getStatusCode());
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "L’assistant IA est temporairement indisponible.");
        } catch (RestClientException e) {
            log.error("Impossible de joindre Gemini.", e);
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "L’assistant IA est temporairement indisponible.");
        }
    }

    private void verifierConversation(List<AssistantChatRequest.Message> messages) {
        if (messages == null || messages.isEmpty() || messages.size() > HISTORIQUE_MAX
                || messages.get(messages.size() - 1) == null
                || !"user".equals(messages.get(messages.size() - 1).role())) {
            throw new RegleMetierException("La conversation envoyée est invalide.");
        }
        for (AssistantChatRequest.Message message : messages) {
            if (message == null || message.role() == null
                    || !(message.role().equals("user") || message.role().equals("assistant"))
                    || message.content() == null || message.content().isBlank()
                    || message.content().length() > MESSAGE_MAX) {
                throw new RegleMetierException("Un message de la conversation est invalide.");
            }
        }
    }

    private String extraireReponse(JsonNode response) {
        JsonNode parts = response == null ? null : response.path("candidates").path(0)
                .path("content").path("parts");
        if (parts == null || !parts.isArray()) {
            log.warn("Gemini n'a retourné aucun contenu exploitable.");
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "L’assistant n’a pas pu préparer de réponse. Reformulez votre question.");
        }

        StringBuilder texte = new StringBuilder();
        for (JsonNode part : parts) {
            JsonNode text = part.get("text");
            if (text != null && text.isTextual()) {
                if (texte.length() > 0) texte.append('\n');
                texte.append(text.asText());
            }
        }
        if (texte.isEmpty()) {
            log.warn("Gemini a retourné une réponse vide.");
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "L’assistant n’a pas pu préparer de réponse. Reformulez votre question.");
        }
        return texte.toString();
    }

    private record GeminiRequest(
            List<GeminiContent> contents,
            @JsonProperty("systemInstruction") GeminiSystemInstruction systemInstruction,
            @JsonProperty("generationConfig") GeminiGenerationConfig generationConfig
    ) {
    }

    private record GeminiContent(String role, List<GeminiPart> parts) {
    }

    private record GeminiSystemInstruction(List<GeminiPart> parts) {
    }

    private record GeminiPart(String text) {
    }

    private record GeminiGenerationConfig(
            @JsonProperty("maxOutputTokens") int maxOutputTokens
    ) {
    }
}
