package com.finco.audit;

import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Le comparateur ne conserve QUE les champs réellement modifiés : c'est la
 * garantie qu'aucune donnée inchangée (ni sensible) n'est recopiée dans le
 * journal d'audit.
 */
class DiffAuditTest {

    @Test
    void comparer_neConserveQueLesChampsModifies() {
        Map<String, Object> avant = new LinkedHashMap<>();
        avant.put("libelle", "Loyer");
        avant.put("montant", 1000);
        avant.put("centre", "ADM");

        Map<String, Object> apres = new LinkedHashMap<>();
        apres.put("libelle", "Loyer");
        apres.put("montant", 1200);
        apres.put("centre", "ADM");

        DiffAudit.Diff diff = DiffAudit.comparer(avant, apres);

        assertTrue(diff.aDesChangements());
        assertTrue(diff.ancienneValeur().contains("montant"));
        assertTrue(diff.ancienneValeur().contains("1000"));
        assertFalse(diff.ancienneValeur().contains("libelle"));
        assertFalse(diff.nouvelleValeur().contains("centre"));
        assertTrue(diff.nouvelleValeur().contains("1200"));
    }

    @Test
    void comparer_sansChangement_neRenvoieRien() {
        Map<String, Object> etat = Map.of("libelle", "Loyer", "montant", 1000);

        DiffAudit.Diff diff = DiffAudit.comparer(etat, etat);

        assertFalse(diff.aDesChangements());
        assertNull(diff.ancienneValeur());
        assertNull(diff.nouvelleValeur());
    }

    @Test
    void comparer_champSupprime_estJournalise() {
        Map<String, Object> avant = new LinkedHashMap<>();
        avant.put("commission", 50);
        Map<String, Object> apres = new LinkedHashMap<>();

        DiffAudit.Diff diff = DiffAudit.comparer(avant, apres);

        assertTrue(diff.aDesChangements());
        assertTrue(diff.ancienneValeur().contains("commission"));
        assertTrue(diff.nouvelleValeur().contains("commission"));
    }
}
