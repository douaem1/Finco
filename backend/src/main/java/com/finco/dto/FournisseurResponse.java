package com.finco.dto;

import com.finco.entity.Fournisseur;

public record FournisseurResponse(
        Long id,
        String nom,
        String ice,
        String email,
        String telephone,
        String rib
) {
    public static FournisseurResponse de(Fournisseur f) {
        return new FournisseurResponse(
                f.getId(),
                f.getNom(),
                f.getIce(),
                f.getEmail(),
                f.getTelephone(),
                f.getRib()
        );
    }
}
