package com.finco.entity;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;

/**
 * Entité représentant un Fournisseur.
 */
@Entity
@DiscriminatorValue("FOURNISSEUR")
public class Fournisseur extends Tiers {

    /** RIB de 24 chiffres du compte bancaire du fournisseur. */
    @Column(name = "rib", length = 24)
    private String rib;

    public Fournisseur() {
        super();
    }

    public Fournisseur(String nom, String ice, String email, String telephone, String rib) {
        super(nom, ice, email, telephone);
        this.rib = rib;
    }

    public String getRib() {
        return rib;
    }

    public void setRib(String rib) {
        this.rib = rib;
    }
}
