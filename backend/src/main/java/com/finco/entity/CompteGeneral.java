package com.finco.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Compte du plan comptable CGNC (table `compte_general`), ex. 6136, 4411, 5141.
 * La classe (1 à 8) est le premier chiffre du numéro : 6 = charges, 7 = produits...
 */
@Entity
@Table(name = "compte_general")
public class CompteGeneral {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 10)
    private String numero;

    @Column(nullable = false, length = 150)
    private String libelle;

    @Column(nullable = false)
    private int classe;

    public CompteGeneral() {
    }

    public CompteGeneral(String numero, String libelle, int classe) {
        this.numero = numero;
        this.libelle = libelle;
        this.classe = classe;
    }

    /** Un compte de classe 6 est un compte de charges. */
    public boolean estCompteDeCharges() {
        return classe == 6;
    }

    public Long getId() { return id; }
    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }
    public String getLibelle() { return libelle; }
    public void setLibelle(String libelle) { this.libelle = libelle; }
    public int getClasse() { return classe; }
    public void setClasse(int classe) { this.classe = classe; }
}
