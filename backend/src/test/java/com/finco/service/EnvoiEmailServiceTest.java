package com.finco.service;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class EnvoiEmailServiceTest {

    @Test
    @SuppressWarnings("unchecked")
    void construitUnEmailTexteEtHtml() throws Exception {
        JavaMailSender sender = mock(JavaMailSender.class);
        when(sender.createMimeMessage()).thenReturn(new MimeMessage(Session.getInstance(new Properties())));
        ObjectProvider<JavaMailSender> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(sender);

        new EnvoiEmailService(provider, "FinCo <no-reply@finco.ma>")
                .envoyerCodeConnexion("sara@finco.ma", "Sara", "123456", 5);

        ArgumentCaptor<MimeMessage> envoye = ArgumentCaptor.forClass(MimeMessage.class);
        verify(sender).send(envoye.capture());
        assertThat(envoye.getValue().getSubject()).contains("123456");
    }

    @Test
    @SuppressWarnings("unchecked")
    void envoieLaNotificationApresValidationDeLaTransaction() throws Exception {
        JavaMailSender sender = mock(JavaMailSender.class);
        when(sender.createMimeMessage()).thenReturn(new MimeMessage(Session.getInstance(new Properties())));
        ObjectProvider<JavaMailSender> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(sender);
        EnvoiEmailService service = new EnvoiEmailService(provider, "FinCo <no-reply@finco.ma>");

        TransactionSynchronizationManager.initSynchronization();
        try {
            service.envoyerNotification("sara@finco.ma", "Facture réglée", "La facture est réglée.");
            verify(sender, never()).send(any(MimeMessage.class));

            TransactionSynchronizationManager.getSynchronizations().forEach(s -> s.afterCommit());

            ArgumentCaptor<MimeMessage> envoye = ArgumentCaptor.forClass(MimeMessage.class);
            verify(sender).send(envoye.capture());
            assertThat(envoye.getValue().getSubject()).isEqualTo("Facture réglée");
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }
}
