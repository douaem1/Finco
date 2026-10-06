package com.finco.service;

import com.finco.entity.CodeOtp;
import com.finco.entity.Utilisateur;
import com.finco.exception.AuthentificationException;
import com.finco.exception.RegleMetierException;
import com.finco.repository.CodeOtpRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Règles métier du code OTP (2e facteur de connexion) :
 *  - code aléatoire de 6 chiffres (SecureRandom, imprévisible) ;
 *  - stocké HACHÉ (BCrypt), comme un mot de passe ;
 *  - valable quelques minutes, nombre d'essais limité, usage unique ;
 *  - renvoi possible seulement après un délai (anti-spam).
 *
 * Les méthodes s'exécutent dans la transaction de AuthService.
 */
@Service
public class OtpService {

    private static final SecureRandom ALEATOIRE = new SecureRandom();

    private final CodeOtpRepository codeOtpRepository;
    private final PasswordEncoder passwordEncoder;
    private final EnvoiEmailService envoiEmailService;
    private final long dureeValiditeMinutes;
    private final int tentativesMax;
    private final long delaiRenvoiSecondes;

    public OtpService(CodeOtpRepository codeOtpRepository,
                      PasswordEncoder passwordEncoder,
                      EnvoiEmailService envoiEmailService,
                      @Value("${app.otp.duree-validite-minutes}") long dureeValiditeMinutes,
                      @Value("${app.otp.tentatives-max}") int tentativesMax,
                      @Value("${app.otp.delai-renvoi-secondes}") long delaiRenvoiSecondes) {
        this.codeOtpRepository = codeOtpRepository;
        this.passwordEncoder = passwordEncoder;
        this.envoiEmailService = envoiEmailService;
        this.dureeValiditeMinutes = dureeValiditeMinutes;
        this.tentativesMax = tentativesMax;
        this.delaiRenvoiSecondes = delaiRenvoiSecondes;
    }

    /** Crée un nouveau code pour l'utilisateur, l'envoie, et renvoie la ligne créée. */
    public CodeOtp creerEtEnvoyer(Utilisateur utilisateur) {
        codeOtpRepository.invaliderCodesActifs(utilisateur);
        CodeOtp otp = new CodeOtp(utilisateur, UUID.randomUUID().toString());
        genererEtEnvoyer(otp);
        return codeOtpRepository.save(otp);
    }

    /** Renvoie un nouveau code pour la même tentative de connexion. */
    public CodeOtp renvoyer(String jeton) {
        CodeOtp otp = trouverActif(jeton);
        long attente = delaiRenvoiSecondes - Duration.between(otp.getEnvoyeLe(), LocalDateTime.now()).getSeconds();
        if (attente > 0) {
            throw new RegleMetierException("Patientez " + attente + " s avant de demander un nouveau code.");
        }
        genererEtEnvoyer(otp);
        return codeOtpRepository.save(otp);
    }

    /**
     * Vérifie le code saisi. En cas d'échec, le compteur de tentatives est
     * enregistré malgré l'exception (cf. noRollbackFor dans AuthService).
     * @return l'utilisateur authentifié
     */
    public Utilisateur verifier(String jeton, String code) {
        if (code == null || !code.trim().matches("\\d{6}")) {
            throw new RegleMetierException("Le code doit contenir 6 chiffres.");
        }
        CodeOtp otp = trouverActif(jeton);

        if (otp.estExpire(LocalDateTime.now())) {
            throw new AuthentificationException("Ce code a expiré. Demandez un nouveau code.");
        }
        if (otp.getTentatives() >= tentativesMax) {
            throw new AuthentificationException("Trop de tentatives. Demandez un nouveau code.");
        }
        if (!passwordEncoder.matches(code.trim(), otp.getCodeHache())) {
            otp.ajouterTentative();
            codeOtpRepository.save(otp);
            int restantes = tentativesMax - otp.getTentatives();
            throw new AuthentificationException(restantes > 0
                    ? "Code incorrect. Il vous reste " + restantes + " essai" + (restantes > 1 ? "s" : "") + "."
                    : "Code incorrect. Demandez un nouveau code.");
        }

        otp.setUtilise(true); // usage unique
        codeOtpRepository.save(otp);
        return otp.getUtilisateur();
    }

    public long validiteSecondes() {
        return dureeValiditeMinutes * 60;
    }

    public long delaiRenvoiSecondes() {
        return delaiRenvoiSecondes;
    }

    // ----------------------------------------------------------------

    private void genererEtEnvoyer(CodeOtp otp) {
        String code = String.format("%06d", ALEATOIRE.nextInt(1_000_000));
        LocalDateTime maintenant = LocalDateTime.now();
        otp.nouveauCode(passwordEncoder.encode(code), maintenant, maintenant.plusMinutes(dureeValiditeMinutes));

        Utilisateur u = otp.getUtilisateur();
        envoiEmailService.envoyerCodeConnexion(u.getEmail(), u.getPrenom(), code, dureeValiditeMinutes);
    }

    private CodeOtp trouverActif(String jeton) {
        if (jeton == null || jeton.isBlank()) {
            throw new AuthentificationException("Session de connexion invalide. Reconnectez-vous.");
        }
        CodeOtp otp = codeOtpRepository.findByJeton(jeton)
                .orElseThrow(() -> new AuthentificationException("Session de connexion invalide. Reconnectez-vous."));
        if (otp.isUtilise()) {
            throw new AuthentificationException("Ce code n'est plus valable. Reconnectez-vous.");
        }
        return otp;
    }
}
