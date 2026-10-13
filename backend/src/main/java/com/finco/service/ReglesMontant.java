package com.finco.service;

import com.finco.exception.RegleMetierException;

import java.math.BigDecimal;

/**
 * Format commun à tous les montants de FinCo, stockés en DECIMAL(15,2) :
 * 2 décimales au maximum et 13 chiffres avant la virgule au maximum.
 */
final class ReglesMontant {

    static final BigDecimal MAXIMUM = new BigDecimal("9999999999999.99");

    private ReglesMontant() {
    }

    /**
     * @param champ   nom du champ concerné dans le formulaire (ex. "montantPrevu")
     * @param libelle début de phrase du message (ex. "Le montant prévu")
     */
    static void verifierFormat(BigDecimal montant, String champ, String libelle) {
        if (montant.stripTrailingZeros().scale() > 2) {
            throw new RegleMetierException(champ, libelle + " ne peut pas avoir plus de 2 décimales.");
        }
        if (montant.abs().compareTo(MAXIMUM) > 0) {
            throw new RegleMetierException(champ, libelle + " est trop élevé (13 chiffres avant la virgule au maximum).");
        }
    }
}
