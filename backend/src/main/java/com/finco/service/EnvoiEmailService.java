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
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Envoi des codes OTP et des notifications métier par email.
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
            log.warn("""

                    ================================================================
                     [MODE DÉVELOPPEMENT] Serveur email non accessible ou non configuré.
                     Code de connexion pour {} : {}   (valable {} min)
                    ================================================================""",
                    destinataire, code, validiteMinutes);
        }
    }

    public void envoyerNotification(String destinataire, String sujet, String contenu) {
        Runnable envoi = () -> envoyerNotificationImmediatement(destinataire, sujet, contenu);
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    envoi.run();
                }
            });
        } else {
            envoi.run();
        }
    }

    private void envoyerNotificationImmediatement(String destinataire, String sujet, String contenu) {
        if (destinataire == null || destinataire.isBlank()) {
            log.warn("Notification email '{}' non envoyée : aucun destinataire configuré.", sujet);
            return;
        }

        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null) {
            log.warn("Notification email '{}' non envoyée : aucun serveur email configuré.", sujet);
            return;
        }

        try {
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper aide = new MimeMessageHelper(message, true, "UTF-8");
            aide.setFrom(expediteur);
            aide.setTo(destinataire);
            aide.setSubject(sujet);
            aide.setText(contenu, htmlNotification(sujet, contenu));
            sender.send(message);
            log.info("Notification email '{}' envoyée à {}", sujet, destinataire);
        } catch (MessagingException | MailException e) {
            log.error("Échec de l'envoi de la notification email '{}' à {}.", sujet, destinataire, e);
        }
    }

    private String htmlNotification(String sujet, String contenu) {
        return """
                <div style="font-family:Arial,sans-serif;max-width:560px;margin:24px auto;color:#24342f;border:1px solid #e7e5df;border-radius:12px;overflow:hidden">
                  <div style="background:#24342f;color:#fff;padding:20px 24px;font-size:20px;font-weight:bold">FinCo</div>
                  <div style="padding:24px">
                    <h1 style="font-size:20px;font-weight:600;margin:0 0 16px">%s</h1>
                    <p style="font-size:15px;line-height:1.6;margin:0;color:#52615b">%s</p>
                  </div>
                  <div style="padding:14px 24px;border-top:1px solid #e7e5df;color:#79847f;font-size:12px">Notification automatique — FinCo</div>
                </div>
                """.formatted(echapperHtml(sujet), echapperHtml(contenu).replace("\n", "<br>"));
    }

    private String echapperHtml(String texte) {
        return texte.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&#39;");
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
