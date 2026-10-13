package com.finco.config;

import com.finco.security.JwtAuthFilter;
import com.finco.security.ReponsesSecuriteJson;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Configuration de la sécurité et du CORS.
 *
 * @Configuration : classe lue au démarrage par le conteneur Spring.
 * Chaque méthode @Bean FABRIQUE un objet que Spring garde et injecte
 * ensuite partout où il est demandé (IoC : c'est Spring qui crée et relie
 * les objets, pas notre code).
 */
@Configuration
public class SecurityConfig {

    /**
     * Règles d'accès de l'API. Les Beans JwtAuthFilter et ReponsesSecuriteJson
     * sont injectés en paramètres de la méthode par le conteneur.
     */
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http,
                                            JwtAuthFilter jwtAuthFilter,
                                            ReponsesSecuriteJson reponsesJson) throws Exception {
        return http
                // API REST avec jeton : pas de cookie de session, donc pas besoin de CSRF.
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                // STATELESS : le serveur ne garde aucune session, chaque requête porte son jeton.
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(e -> e
                        .authenticationEntryPoint(reponsesJson.nonAuthentifie())
                        .accessDeniedHandler(reponsesJson.accesRefuse()))
                .authorizeHttpRequests(regles -> regles
                        // Public
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/test", "/error").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/verifier-otp", "/api/auth/renvoyer-otp").permitAll()

                        // Module COMPTABILITÉ FINANCIÈRE (COMPTABLE uniquement) :
                        // Écritures et journal des pièces
                        .requestMatchers("/api/pieces/**").hasRole("COMPTABLE")
                        // Tiers (clients et fournisseurs)
                        .requestMatchers("/api/fournisseurs/**", "/api/clients/**").hasRole("COMPTABLE")
                        // Exercices comptables (clôture de période)
                        .requestMatchers("/api/exercices/**").hasRole("COMPTABLE")

                        // Module CONTRÔLE DE GESTION (CONTROLEUR uniquement) :
                        // Écriture centres de coûts (CUD)
                        .requestMatchers(HttpMethod.POST, "/api/centres-cout/**").hasRole("CONTROLEUR")
                        .requestMatchers(HttpMethod.PUT, "/api/centres-cout/**").hasRole("CONTROLEUR")
                        .requestMatchers(HttpMethod.DELETE, "/api/centres-cout/**").hasRole("CONTROLEUR")
                        // Budgets CO (gestion complète)
                        .requestMatchers("/api/budgets/**").hasRole("CONTROLEUR")

                        // Module ADMINISTRATION (ADMIN uniquement) :
                        // Écriture plan comptable (CUD comptes généraux)
                        .requestMatchers(HttpMethod.POST, "/api/comptes/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/comptes/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/comptes/**").hasRole("ADMIN")

                        // Consultations transversales (nécessaires pour les listes déroulantes de la saisie d'écritures) :
                        // Lecture des comptes généraux et des centres de coûts : tout utilisateur authentifié
                        .requestMatchers(HttpMethod.GET, "/api/comptes/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/centres-cout/**").authenticated()

                        // Tout le reste (profil /api/auth/me, etc.) : authentifié
                        .anyRequest().authenticated())
                // Notre filtre JWT passe avant le filtre standard login/mot de passe.
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    /**
     * Notre filtre est un @Component : Spring Boot l'ajouterait AUSSI tout seul
     * à Tomcat, en dehors de Spring Security. On désactive cet ajout automatique
     * pour qu'il ne s'exécute qu'une fois, au bon endroit (dans la chaîne ci-dessus).
     */
    @Bean
    FilterRegistrationBean<JwtAuthFilter> desactiverEnregistrementAutoJwt(JwtAuthFilter filtre) {
        FilterRegistrationBean<JwtAuthFilter> enregistrement = new FilterRegistrationBean<>(filtre);
        enregistrement.setEnabled(false);
        return enregistrement;
    }

    /** Hachage des mots de passe : BCrypt (lent et salé, résiste au brute-force). */
    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Le gestionnaire d'authentification de Spring, utilisé par AuthService.
     * Il compare le mot de passe saisi au hachage BCrypt fourni par UtilisateurDetailsService.
     */
    @Bean
    AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    /** CORS : autorise le frontend React (http://localhost:5173) à appeler l'API. */
    @Bean
    CorsConfigurationSource corsConfigurationSource(
            @Value("${app.cors.allowed-origin:http://localhost:5173}") String origineAutorisee) {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(origineAutorisee));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
