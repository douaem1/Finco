package com.finco.controller;

import com.finco.dto.LoginRequest;
import com.finco.dto.LoginResponse;
import com.finco.dto.UtilisateurDto;
import com.finco.service.AuthService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Authentification. Le controller ne fait que recevoir la requête HTTP et
 * déléguer au service : aucune règle métier ici.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /** POST /api/auth/login  { "login": "comptable", "motDePasse": "admin123" } */
    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest requete) {
        return authService.connecter(requete);
    }

    /**
     * GET /api/auth/me — qui suis-je ? (nécessite le jeton)
     * Spring injecte l'objet Authentication rempli par JwtAuthFilter.
     */
    @GetMapping("/me")
    public UtilisateurDto moi(Authentication authentification) {
        return authService.profil(authentification.getName());
    }
}
