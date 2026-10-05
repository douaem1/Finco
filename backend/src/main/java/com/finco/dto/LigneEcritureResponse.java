package com.finco.dto;

import com.finco.entity.LigneEcriture;

import java.math.BigDecimal;

/** Ligne renvoyée au frontend, « aplatie » (numéro et libellé du compte inclus). */
public record LigneEcritureResponse(Long id, String compteNumero, String compteLibelle,
                                    String centreCoutCode, String sens, BigDecimal montant) {

    public static LigneEcritureResponse depuis(LigneEcriture l) {
        return new LigneEcritureResponse(
                l.getId(),
                l.getCompte().getNumero(),
                l.getCompte().getLibelle(),
                l.getCentreCout() == null ? null : l.getCentreCout().getCode(),
                l.getSens().name(),
                l.getMontant());
    }
}
