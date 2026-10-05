package com.finco.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finco.exception.ErreurResponse;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Les erreurs 401 / 403 sont produites par les filtres de Spring Security,
 * AVANT d'atteindre les controllers : le @RestControllerAdvice ne les voit pas.
 * Ce Bean les renvoie donc lui-même au même format JSON { "message": "..." }.
 */
@Component
public class ReponsesSecuriteJson {

    private final ObjectMapper objectMapper;

    public ReponsesSecuriteJson(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /** 401 : pas de jeton, jeton invalide ou expiré. */
    public AuthenticationEntryPoint nonAuthentifie() {
        return (requete, reponse, exception) ->
                ecrire(reponse, HttpServletResponse.SC_UNAUTHORIZED, "Authentification requise : veuillez vous connecter.");
    }

    /** 403 : connecté, mais rôle insuffisant. */
    public AccessDeniedHandler accesRefuse() {
        return (requete, reponse, exception) ->
                ecrire(reponse, HttpServletResponse.SC_FORBIDDEN, "Accès refusé : votre rôle ne permet pas cette action.");
    }

    private void ecrire(HttpServletResponse reponse, int statut, String message) throws IOException {
        reponse.setStatus(statut);
        reponse.setContentType(MediaType.APPLICATION_JSON_VALUE);
        reponse.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(reponse.getWriter(), new ErreurResponse(message));
    }
}
