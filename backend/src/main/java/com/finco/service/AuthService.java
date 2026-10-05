package com.finco.service;

import com.finco.dto.LoginRequest;
import com.finco.dto.LoginResponse;
import com.finco.dto.UtilisateurDto;
import com.finco.entity.Utilisateur;
import com.finco.exception.RegleMetierException;
import com.finco.exception.RessourceIntrouvableException;
import com.finco.repository.UtilisateurRepository;
import com.finco.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Logique de connexion.
 * Trois Beans lui sont injectés par constructeur : le gestionnaire
 * d'authentification de Spring, le service JWT et le repository.
 */
@Service
@Transactional(readOnly = true)
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UtilisateurRepository utilisateurRepository;

    public AuthService(AuthenticationManager authenticationManager,
                       JwtService jwtService,
                       UtilisateurRepository utilisateurRepository) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.utilisateurRepository = utilisateurRepository;
    }

    /**
     * Vérifie login + mot de passe, puis renvoie un jeton JWT.
     * Si le mot de passe est faux, authenticate() lève BadCredentialsException
     * (traduite en 401 par GlobalExceptionHandler).
     */
    public LoginResponse connecter(LoginRequest requete) {
        if (requete == null || estVide(requete.login()) || estVide(requete.motDePasse())) {
            throw new RegleMetierException("Le login et le mot de passe sont obligatoires.");
        }
        String login = requete.login().trim();

        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(login, requete.motDePasse()));

        Utilisateur utilisateur = trouverParLogin(login);
        String token = jwtService.genererToken(utilisateur.getLogin(), utilisateur.getRole().name());
        return new LoginResponse(token, versDto(utilisateur));
    }

    /** Profil de l'utilisateur connecté (GET /api/auth/me). */
    public UtilisateurDto profil(String login) {
        return versDto(trouverParLogin(login));
    }

    private Utilisateur trouverParLogin(String login) {
        return utilisateurRepository.findByLogin(login)
                .orElseThrow(() -> new RessourceIntrouvableException("Utilisateur introuvable : " + login));
    }

    private UtilisateurDto versDto(Utilisateur u) {
        return new UtilisateurDto(u.getLogin(), u.getNomComplet(), u.getRole().name());
    }

    private boolean estVide(String valeur) {
        return valeur == null || valeur.isBlank();
    }
}
