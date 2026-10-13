package com.finco.dto;

import com.finco.entity.Client;

import java.math.BigDecimal;

public record ClientResponse(
        Long id,
        String nom,
        String ice,
        String email,
        String telephone,
        BigDecimal plafondCredit
) {
    public static ClientResponse de(Client c) {
        return new ClientResponse(
                c.getId(),
                c.getNom(),
                c.getIce(),
                c.getEmail(),
                c.getTelephone(),
                c.getPlafondCredit()
        );
    }
}
