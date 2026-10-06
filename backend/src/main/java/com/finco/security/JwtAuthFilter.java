package com.finco.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtre exécuté UNE fois par requête, avant les controllers.
 *
 * 1. Lit l'en-tête « Authorization: Bearer <jeton> ».
 * 2. Vérifie le jeton avec JwtService.
 * 3. Si valide : déclare l'utilisateur comme authentifié dans le
 *    SecurityContext. Sinon : ne fait rien, et Spring Security renverra 401
 *    si la route est protégée.
 *
 * L'API est « stateless » : aucune session serveur, le jeton suffit.
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final String PREFIXE = "Bearer ";

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    public JwtAuthFilter(JwtService jwtService, UserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest requete, HttpServletResponse reponse, FilterChain chaine)
            throws ServletException, IOException {

        String entete = requete.getHeader("Authorization");

        if (entete != null && entete.startsWith(PREFIXE)
                && SecurityContextHolder.getContext().getAuthentication() == null) {

            String email = jwtService.extraireEmailSiValide(entete.substring(PREFIXE.length()));

            if (email != null) {
                try {
                    // On recharge l'utilisateur : un compte désactivé ou supprimé perd l'accès.
                    UserDetails utilisateur = userDetailsService.loadUserByUsername(email);
                    if (utilisateur.isEnabled()) {
                        var authentification = new UsernamePasswordAuthenticationToken(
                                utilisateur, null, utilisateur.getAuthorities());
                        authentification.setDetails(new WebAuthenticationDetailsSource().buildDetails(requete));
                        SecurityContextHolder.getContext().setAuthentication(authentification);
                    }
                } catch (UsernameNotFoundException e) {
                    // Utilisateur supprimé depuis l'émission du jeton : on reste anonyme.
                }
            }
        }

        chaine.doFilter(requete, reponse);
    }
}
