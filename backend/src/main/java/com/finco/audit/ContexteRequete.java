package com.finco.audit;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.MDC;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Accès au contexte de la requête HTTP courante (requestId, IP, utilisateur),
 * utilisé par le service d'audit pour enrichir chaque événement.
 */
public final class ContexteRequete {

    public static final String CLE_MDC_REQUEST_ID = "requestId";
    public static final String ENTETE_REQUEST_ID = "X-Request-Id";

    private ContexteRequete() {
    }

    /** Identifiant de corrélation de la requête, posé par le filtre (null hors requête). */
    public static String requestId() {
        return MDC.get(CLE_MDC_REQUEST_ID);
    }

    /** Email de l'utilisateur authentifié, ou null (requête anonyme). */
    public static String emailUtilisateur() {
        Authentication authentification = SecurityContextHolder.getContext().getAuthentication();
        if (authentification == null || !authentification.isAuthenticated()) {
            return null;
        }
        String nom = authentification.getName();
        if (nom == null || "anonymousUser".equals(nom)) {
            return null;
        }
        return nom;
    }

    /** Adresse IP de la requête courante, ou null hors requête. */
    public static String adresseIp() {
        HttpServletRequest requete = requeteCourante();
        return requete == null ? null : adresseIp(requete);
    }

    public static HttpServletRequest requeteCourante() {
        RequestAttributes attributs = RequestContextHolder.getRequestAttributes();
        if (attributs instanceof ServletRequestAttributes servlet) {
            return servlet.getRequest();
        }
        return null;
    }

    /**
     * IP cliente : on ne fait confiance à « X-Forwarded-For » que si l'appel
     * direct provient d'un proxy local (loopback ou IP privée) ; sinon on prend
     * l'adresse de la socket.
     */
    public static String adresseIp(HttpServletRequest requete) {
        String distante = requete.getRemoteAddr();
        if (estProxyLocal(distante)) {
            String entete = requete.getHeader("X-Forwarded-For");
            if (entete != null && !entete.isBlank()) {
                String premiere = entete.split(",")[0].trim();
                if (!premiere.isEmpty()) {
                    return tronquer(premiere, 45);
                }
            }
        }
        return tronquer(distante, 45);
    }

    private static boolean estProxyLocal(String adresse) {
        if (adresse == null) {
            return false;
        }
        return adresse.equals("127.0.0.1")
                || adresse.equals("0:0:0:0:0:0:0:1")
                || adresse.equals("::1")
                || adresse.startsWith("10.")
                || adresse.startsWith("192.168.")
                || estPlage172Privee(adresse);
    }

    private static boolean estPlage172Privee(String adresse) {
        if (!adresse.startsWith("172.")) {
            return false;
        }
        String[] parts = adresse.split("\\.");
        if (parts.length < 2) {
            return false;
        }
        try {
            int second = Integer.parseInt(parts[1]);
            return second >= 16 && second <= 31;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private static String tronquer(String valeur, int max) {
        if (valeur == null) {
            return null;
        }
        return valeur.length() > max ? valeur.substring(0, max) : valeur;
    }
}
