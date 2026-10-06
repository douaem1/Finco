package com.finco.service;

import com.finco.dto.LoginRequest;
import com.finco.dto.LoginResponse;
import com.finco.dto.OtpEnvoyeResponse;
import com.finco.dto.UtilisateurDto;
import com.finco.dto.VerificationOtpRequest;
import com.finco.entity.CodeOtp;
import com.finco.entity.Utilisateur;
import com.finco.exception.AuthentificationException;
import com.finco.exception.RegleMetierException;
import com.finco.exception.RessourceIntrouvableException;
import com.finco.repository.UtilisateurRepository;
import com.finco.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Connexion en DEUX étapes (double authentification) :
 *  1. email + mot de passe corrects  -> un code OTP est envoyé par email ;
 *  2. code OTP correct               -> le serveur délivre le jeton JWT.
 * Sans l'étape 2, aucun jeton : connaître le mot de passe ne suffit pas.
 *
 * noRollbackFor : quand un code OTP est faux, on lève une exception MAIS on
 * veut quand même enregistrer le compteur de tentatives (sinon on pourrait
 * essayer les 1 000 000 de codes sans limite).
 */
@Service
@Transactional(noRollbackFor = AuthentificationException.class)
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final OtpService otpService;
    private final UtilisateurRepository utilisateurRepository;

    public AuthService(AuthenticationManager authenticationManager,
                       JwtService jwtService,
                       OtpService otpService,
                       UtilisateurRepository utilisateurRepository) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.otpService = otpService;
        this.utilisateurRepository = utilisateurRepository;
    }

    /**
     * Étape 1 : vérifie email + mot de passe, puis envoie un code OTP.
     * Mot de passe faux -> BadCredentialsException (401, cf. GlobalExceptionHandler).
     */
    public OtpEnvoyeResponse connecter(LoginRequest requete) {
        if (requete == null || estVide(requete.email()) || estVide(requete.motDePasse())) {
            throw new RegleMetierException("L'email et le mot de passe sont obligatoires.");
        }
        String email = normaliserEmail(requete.email());

        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, requete.motDePasse()));

        Utilisateur utilisateur = trouverParEmail(email);
        CodeOtp otp = otpService.creerEtEnvoyer(utilisateur);
        return reponseOtp(otp);
    }

    /** Étape 2 : vérifie le code OTP et délivre le jeton JWT. */
    public LoginResponse verifierOtp(VerificationOtpRequest requete) {
        if (requete == null) {
            throw new RegleMetierException("Aucune donnée reçue.");
        }
        Utilisateur utilisateur = otpService.verifier(requete.jetonOtp(), requete.code());
        String token = jwtService.genererToken(utilisateur.getEmail(), utilisateur.getRole().name());
        return new LoginResponse(token, versDto(utilisateur));
    }

    /** Envoie un nouveau code pour la même tentative de connexion. */
    public OtpEnvoyeResponse renvoyerOtp(String jetonOtp) {
        return reponseOtp(otpService.renvoyer(jetonOtp));
    }

    /** Profil de l'utilisateur connecté (GET /api/auth/me). */
    @Transactional(readOnly = true)
    public UtilisateurDto profil(String email) {
        return versDto(trouverParEmail(email));
    }

    // ----------------------------------------------------------------

    private OtpEnvoyeResponse reponseOtp(CodeOtp otp) {
        return new OtpEnvoyeResponse(otp.getJeton(), masquer(otp.getUtilisateur().getEmail()),
                otpService.validiteSecondes(), otpService.delaiRenvoiSecondes());
    }

    private Utilisateur trouverParEmail(String email) {
        return utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RessourceIntrouvableException("Utilisateur introuvable : " + email));
    }

    private UtilisateurDto versDto(Utilisateur u) {
        return new UtilisateurDto(u.getEmail(), u.getNom(), u.getPrenom(), u.getRole().name());
    }

    /** "sara.bennani@finco.ma" -> "s***i@finco.ma" */
    private String masquer(String email) {
        int arobase = email.indexOf('@');
        if (arobase <= 1) return "***" + email.substring(Math.max(arobase, 0));
        return email.charAt(0) + "***" + email.charAt(arobase - 1) + email.substring(arobase);
    }

    private String normaliserEmail(String email) {
        return email.trim().toLowerCase();
    }

    private boolean estVide(String valeur) {
        return valeur == null || valeur.isBlank();
    }
}
