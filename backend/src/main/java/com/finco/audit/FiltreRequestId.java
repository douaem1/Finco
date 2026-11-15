package com.finco.audit;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Filtre de corrélation : attribue un identifiant unique à chaque requête,
 * l'expose dans le MDC (logs) et le renvoie dans l'en-tête « X-Request-Id ».
 * Exécuté tout en haut de la chaîne pour couvrir les filters de sécurité.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class FiltreRequestId extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest requete, HttpServletResponse reponse, FilterChain chaine)
            throws ServletException, IOException {
        String requestId = requete.getHeader(ContexteRequete.ENTETE_REQUEST_ID);
        if (requestId == null || requestId.isBlank()) {
            requestId = UUID.randomUUID().toString();
        }
        MDC.put(ContexteRequete.CLE_MDC_REQUEST_ID, requestId);
        reponse.setHeader(ContexteRequete.ENTETE_REQUEST_ID, requestId);
        try {
            chaine.doFilter(requete, reponse);
        } finally {
            MDC.remove(ContexteRequete.CLE_MDC_REQUEST_ID);
        }
    }
}
