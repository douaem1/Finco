package com.finco.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/**
 * Gestion GLOBALE des erreurs : @RestControllerAdvice est un Bean qui
 * « écoute » les exceptions levées par tous les controllers.
 *
 * Avantage : aucun try/catch dans les controllers, et le frontend reçoit
 * toujours le même format { "message": "..." } avec le bon code HTTP.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** Règle métier violée -> 400 Bad Request. */
    @ExceptionHandler(RegleMetierException.class)
    public ResponseEntity<ErreurResponse> regleMetier(RegleMetierException e) {
        return reponse(HttpStatus.BAD_REQUEST, e.getMessage());
    }

    /** Élément introuvable -> 404 Not Found. */
    @ExceptionHandler(RessourceIntrouvableException.class)
    public ResponseEntity<ErreurResponse> introuvable(RessourceIntrouvableException e) {
        return reponse(HttpStatus.NOT_FOUND, e.getMessage());
    }

    /** Login ou mot de passe faux -> 401 Unauthorized. */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErreurResponse> mauvaisIdentifiants(BadCredentialsException e) {
        return reponse(HttpStatus.UNAUTHORIZED, "Identifiant ou mot de passe incorrect.");
    }

    /** Compte désactivé -> 401. */
    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<ErreurResponse> compteDesactive(DisabledException e) {
        return reponse(HttpStatus.UNAUTHORIZED, "Ce compte est désactivé.");
    }

    /** Rôle insuffisant -> 403 Forbidden. */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErreurResponse> accesRefuse(AccessDeniedException e) {
        return reponse(HttpStatus.FORBIDDEN, "Accès refusé : votre rôle ne permet pas cette action.");
    }

    /** JSON mal formé (ex. date invalide, sens inconnu) -> 400. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErreurResponse> jsonInvalide(HttpMessageNotReadableException e) {
        return reponse(HttpStatus.BAD_REQUEST, "Données envoyées invalides (format incorrect).");
    }

    /** Paramètre d'URL du mauvais type, ex. /api/centres-cout/abc -> 400. */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErreurResponse> parametreInvalide(MethodArgumentTypeMismatchException e) {
        return reponse(HttpStatus.BAD_REQUEST, "Paramètre invalide : " + e.getName());
    }

    /** Tout le reste -> 500, sans exposer le détail technique au client. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErreurResponse> autre(Exception e) {
        // Erreurs « web » standard de Spring (URL inconnue 404, méthode HTTP non permise 405...) :
        // on garde leur code HTTP d'origine.
        if (e instanceof ErrorResponse erreurWeb) {
            HttpStatus statut = HttpStatus.valueOf(erreurWeb.getStatusCode().value());
            String message = statut == HttpStatus.NOT_FOUND ? "Ressource introuvable." : statut.getReasonPhrase();
            return reponse(statut, message);
        }
        log.error("Erreur inattendue", e);
        return reponse(HttpStatus.INTERNAL_SERVER_ERROR, "Erreur interne du serveur.");
    }

    private ResponseEntity<ErreurResponse> reponse(HttpStatus statut, String message) {
        return ResponseEntity.status(statut).body(new ErreurResponse(message));
    }
}
