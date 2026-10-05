package com.finco.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

/**
 * Fabrique et vérifie les jetons JWT.
 *
 * Un JWT = en-tête.contenu.signature (Base64). Le contenu porte le login
 * (« subject ») et le rôle. La signature HMAC-SHA256, calculée avec une clé
 * secrète connue du serveur seul, empêche toute falsification : si quelqu'un
 * modifie le rôle dans le jeton, la signature ne correspond plus.
 *
 * Les valeurs viennent de application.properties, injectées par CONSTRUCTEUR
 * grâce à @Value (le conteneur Spring les fournit à la création du Bean).
 */
@Service
public class JwtService {

    private final Key cle;
    private final long dureeValiditeMs;

    public JwtService(@Value("${app.jwt.secret}") String secret,
                      @Value("${app.jwt.expiration-ms}") long dureeValiditeMs) {
        // La clé HMAC-SHA256 doit faire au moins 256 bits (32 caractères).
        this.cle = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.dureeValiditeMs = dureeValiditeMs;
    }

    /** Crée un jeton signé valable `dureeValiditeMs` (24 h par défaut). */
    public String genererToken(String login, String role) {
        Date maintenant = new Date();
        return Jwts.builder()
                .setSubject(login)
                .claim("role", role)
                .setIssuedAt(maintenant)
                .setExpiration(new Date(maintenant.getTime() + dureeValiditeMs))
                .signWith(cle, SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Vérifie la signature et la date d'expiration, puis renvoie le login.
     * Renvoie null si le jeton est invalide, falsifié ou expiré.
     */
    public String extraireLoginSiValide(String token) {
        try {
            Claims contenu = Jwts.parserBuilder()
                    .setSigningKey(cle)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            return contenu.getSubject();
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }
}
