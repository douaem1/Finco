package com.finco.service;

import com.finco.exception.RegleMetierException;

import java.math.BigDecimal;

/**
 * Règles de saisie communes aux tiers (fournisseurs et clients), conformes au
 * modèle de données FinCo (table tiers) et aux usages marocains :
 *  - nom obligatoire, 150 caractères max ;
 *  - ICE facultatif mais, s'il est saisi, exactement 15 chiffres ;
 *  - email facultatif, format valide, 100 caractères max ;
 *  - téléphone facultatif, numéro marocain (05/06/07/08 + 8 chiffres, ou +212) ;
 *  - RIB (fournisseur) facultatif, exactement 24 chiffres ;
 *  - plafond de crédit (client) >= 0, 2 décimales max, 13 chiffres avant la virgule max.
 *
 * Classe utilitaire (méthodes statiques) : ce n'est pas un Bean, elle ne dépend de rien.
 * Les espaces, points et tirets saisis pour la lisibilité sont retirés avant contrôle.
 */
final class ReglesTiers {

    private static final String MOTIF_EMAIL = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";
    private static final String MOTIF_TELEPHONE = "^(\\+212|0)[5-8][0-9]{8}$";

    private ReglesTiers() {
    }

    static String nom(String nom, String typeTiers) {
        if (nom == null || nom.isBlank()) {
            throw new RegleMetierException("nom", "Le nom du " + typeTiers + " est obligatoire.");
        }
        String propre = nom.trim().replaceAll("\\s+", " ");
        if (propre.length() > 150) {
            throw new RegleMetierException("nom", "Le nom ne doit pas dépasser 150 caractères.");
        }
        return propre;
    }

    /** @return l'ICE sur 15 chiffres, ou null s'il n'est pas renseigné */
    static String ice(String ice) {
        String chiffres = sansSeparateurs(ice);
        if (chiffres == null) return null;
        if (!chiffres.matches("^[0-9]{15}$")) {
            throw new RegleMetierException("ice", "L'ICE doit comporter exactement 15 chiffres.");
        }
        return chiffres;
    }

    static String email(String email) {
        if (email == null || email.isBlank()) return null;
        String propre = email.trim().toLowerCase();
        if (propre.length() > 100) {
            throw new RegleMetierException("email", "L'email ne doit pas dépasser 100 caractères.");
        }
        if (!propre.matches(MOTIF_EMAIL)) {
            throw new RegleMetierException("email", "L'adresse email est invalide (ex. contact@societe.ma).");
        }
        return propre;
    }

    static String telephone(String telephone) {
        String compact = sansSeparateurs(telephone);
        if (compact == null) return null;
        if (compact.startsWith("00212")) compact = "+" + compact.substring(2);
        if (!compact.matches(MOTIF_TELEPHONE)) {
            throw new RegleMetierException("telephone",
                    "Le téléphone doit être un numéro marocain : 10 chiffres commençant par 05, 06, 07 ou 08 (ou +212).");
        }
        return compact;
    }

    static String rib(String rib) {
        String chiffres = sansSeparateurs(rib);
        if (chiffres == null) return null;
        if (!chiffres.matches("^[0-9]{24}$")) {
            throw new RegleMetierException("rib", "Le RIB doit comporter exactement 24 chiffres.");
        }
        return chiffres;
    }

    static BigDecimal plafondCredit(BigDecimal plafond) {
        if (plafond == null) return BigDecimal.ZERO;
        if (plafond.signum() < 0) {
            throw new RegleMetierException("plafondCredit", "Le plafond de crédit doit être supérieur ou égal à zéro.");
        }
        ReglesMontant.verifierFormat(plafond, "plafondCredit", "Le plafond de crédit");
        return plafond.setScale(2);
    }

    private static String sansSeparateurs(String valeur) {
        if (valeur == null || valeur.isBlank()) return null;
        return valeur.replaceAll("[\\s.\\-]", "");
    }
}
