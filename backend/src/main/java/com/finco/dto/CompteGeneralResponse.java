package com.finco.dto;

import com.finco.entity.CompteGeneral;

public record CompteGeneralResponse(
        Long id,
        String numero,
        String libelle,
        int classe
) {
    public static CompteGeneralResponse de(CompteGeneral c) {
        return new CompteGeneralResponse(
                c.getId(),
                c.getNumero(),
                c.getLibelle(),
                c.getClasse()
        );
    }
}
