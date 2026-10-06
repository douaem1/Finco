package com.finco.service;

import com.finco.exception.RegleMetierException;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Envoi du code OTP par email.
 *
 * Le Bean JavaMailSender n'existe QUE si spring.mail.host est configuré.
 * On le demande donc via ObjectProvider (injection « optionnelle ») :
 *  - configuré     -> vrai email envoyé ;
 *  - non configuré -> le code est écrit dans la console (mode développement).
 */
@Service
public class EnvoiEmailService {

    private static final Logger log = LoggerFactory.getLogger(EnvoiEmailService.class);

    private final ObjectProvider<JavaMailSender> mailSender;
    private final String expediteur;

    public EnvoiEmailService(ObjectProvider<JavaMailSender> mailSender,
                             @Value("${app.mail.expediteur}") String expediteur) {
        this.mailSender = mailSender;
        this.expediteur = expediteur;
    }

    public void envoyerCodeConnexion(String destinataire, String prenom, String code, long validiteMinutes) {
        JavaMailSender sender = mailSender.getIfAvailable();

        if (sender == null) {
            log.warn("""

                    ================================================================
                     [MODE DÉVELOPPEMENT] Aucun serveur email configuré.
                     Code de connexion pour {} : {}   (valable {} min)
                    ================================================================""",
                    destinataire, code, validiteMinutes);
            return;
        }

        try {
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper aide = new MimeMessageHelper(message, true, "UTF-8"); // true = multipart : version texte + version HTML
            aide.setFrom(expediteur);
            aide.setTo(destinataire);
            aide.setSubject("Votre code de connexion FinCo : " + code);
            aide.setText(texteBrut(prenom, code, validiteMinutes), html(prenom, code, validiteMinutes));
            sender.send(message);
            log.info("Code de connexion envoyé à {}", destinataire);
        } catch (MessagingException | MailException e) {
            log.error("Échec de l'envoi de l'email à {}", destinataire, e);
            throw new RegleMetierException("Impossible d'envoyer le code par email. Réessayez dans quelques instants.");
        }
    }

    private String texteBrut(String prenom, String code, long minutes) {
        return "Bonjour " + prenom + ",\n\nVotre code de connexion FinCo est : " + code
                + "\nIl est valable " + minutes + " minutes.\n\n"
                + "Si vous n'êtes pas à l'origine de cette connexion, changez votre mot de passe.";
    }

    private String html(String prenom, String code, long minutes) {
        return """
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#1B2A3A">
                  <div style="background:#12304F;color:#fff;padding:18px 24px;font-size:18px;font-weight:bold">FinCo</div>
                  <div style="padding:24px;border:1px solid #DCE1E8;border-top:none">
                    <p>Bonjour %s,</p>
                    <p>Voici votre code de connexion :</p>
                    <p style="font-size:32px;letter-spacing:8px;font-weight:bold;color:#12304F;margin:20px 0">%s</p>
                    <p style="color:#5A6676">Il est valable %d minutes. Ne le communiquez à personne.</p>
                    <p style="color:#5A6676;font-size:13px">Si vous n'êtes pas à l'origine de cette connexion, changez votre mot de passe.</p>
                  </div>
                </div>
                """.formatted(prenom, code, minutes);
    }
}
