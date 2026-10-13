package com.finco.entity;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

import java.math.BigDecimal;

/**
 * Entité représentant un Client.
 */
@Entity
@DiscriminatorValue("CLIENT")
public class Client extends Tiers {

    /** Plafond de crédit accordé au client. */
    @Column(name = "plafond_credit", precision = 15, scale = 2)
    private BigDecimal plafondCredit;

    public Client() {
        super();
    }

    public Client(String nom, String ice, String email, String telephone, BigDecimal plafondCredit) {
        super(nom, ice, email, telephone);
        this.plafondCredit = plafondCredit;
    }

    public BigDecimal getPlafondCredit() {
        return plafondCredit;
    }

    public void setPlafondCredit(BigDecimal plafondCredit) {
        this.plafondCredit = plafondCredit;
    }
}
