package com.finco.controller;

import com.finco.dto.LoginRequest;
import com.finco.dto.LoginResponse;
import com.finco.dto.OtpEnvoyeResponse;
import com.finco.dto.RenvoiOtpRequest;
import com.finco.dto.UtilisateurDto;
import com.finco.dto.VerificationOtpRequest;
import com.finco.service.AuthService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Authentification en deux étapes. Le controller ne fait que recevoir la
 * requête HTTP et déléguer au service : aucune règle métier ici.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /** Étape 1 — { "email": "...", "motDePasse": "..." } -> code envoyé par email. */
    @PostMapping("/login")
    public OtpEnvoyeResponse login(@RequestBody LoginRequest requete) {
        return authService.connecter(requete);
    }

    /** Étape 2 — { "jetonOtp": "...", "code": "123456" } -> jeton JWT. */
    @PostMapping("/verifier-otp")
    public LoginResponse verifierOtp(@RequestBody VerificationOtpRequest requete) {
        return authService.verifierOtp(requete);
    }

    /** Nouveau code — { "jetonOtp": "..." }. */
    @PostMapping("/renvoyer-otp")
    public OtpEnvoyeResponse renvoyerOtp(@RequestBody RenvoiOtpRequest requete) {
        return authService.renvoyerOtp(requete == null ? null : requete.jetonOtp());
    }

    /** GET /api/auth/me — qui suis-je ? (nécessite le jeton JWT) */
    @GetMapping("/me")
    public UtilisateurDto moi(Authentication authentification) {
        return authService.profil(authentification.getName());
    }
}
