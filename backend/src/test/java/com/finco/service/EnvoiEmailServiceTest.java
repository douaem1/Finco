package com.finco.service;

import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;

import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
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
}
