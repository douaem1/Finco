package com.finco.audit;

import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Immuabilité du journal : le dépôt n'expose ni update ni delete, et l'entité
 * n'expose aucun setter.
 */
class AuditImmutabiliteTest {

    @Test
    void leDepotNExposeAucuneOperationDeModificationOuDeSuppression() {
        for (Method methode : AuditRepository.class.getMethods()) {
            String nom = methode.getName().toLowerCase();
            assertFalse(nom.startsWith("delete"), "Méthode de suppression exposée : " + methode.getName());
            assertFalse(nom.startsWith("remove"), "Méthode de suppression exposée : " + methode.getName());
            assertFalse(nom.startsWith("saveall"), "Méthode d'écriture groupée exposée : " + methode.getName());
            assertFalse(nom.startsWith("update"), "Méthode de mise à jour exposée : " + methode.getName());
        }
    }

    @Test
    void lEntiteNExposeAucunSetter() {
        for (Method methode : AuditEvent.class.getDeclaredMethods()) {
            String nom = methode.getName();
            boolean setter = nom.startsWith("set") && methode.getParameterCount() == 1
                    && java.lang.reflect.Modifier.isPublic(methode.getModifiers());
            assertFalse(setter, "Setter public exposé : " + nom);
        }
    }

    @Test
    void lEntiteEstAnnoteeImmuablePourHibernate() {
        assertTrue(AuditEvent.class.isAnnotationPresent(org.hibernate.annotations.Immutable.class),
                "L'entité AuditEvent doit être annotée @Immutable.");
    }
}
