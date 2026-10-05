package com.finco.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Entité JPA « Centre de coûts » (module CO - contrôle de gestion).
 *
 * @Entity indique à Hibernate que cette classe correspond à une table.
 * Avec ddl-auto=update, Hibernate crée automatiquement la table `centre_cout`
 * au démarrage si elle n'existe pas.
 *
 * Remarque : une entité n'est PAS un Bean Spring. C'est un simple objet de
 * données, créé avec `new` ou par Hibernate lors d'une lecture en base.
 * Les règles métier (code obligatoire, unique...) ne sont PAS ici :
 * elles sont dans CentreCoutService. Les contraintes @Column ci-dessous ne
 * sont qu'un dernier filet de sécurité au niveau de la base de données.
 */
@Entity
@Table(name = "centre_cout")
public class CentreCout {

    /** Clé primaire auto-incrémentée par MySQL (AUTO_INCREMENT). */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Code du centre, ex. "PROD", "ADM". Unique et non null en base. */
    @Column(name = "code", nullable = false, unique = true, length = 10)
    private String code;

    /** Libellé lisible, ex. "Atelier de production". */
    @Column(name = "libelle", nullable = false, length = 100)
    private String libelle;

    /** true = centre principal, false = centre auxiliaire. */
    @Column(name = "principal", nullable = false)
    private boolean principal;

    /** Constructeur sans argument : obligatoire pour JPA/Hibernate. */
    public CentreCout() {
    }

    public CentreCout(String code, String libelle, boolean principal) {
        this.code = code;
        this.libelle = libelle;
        this.principal = principal;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getLibelle() {
        return libelle;
    }

    public void setLibelle(String libelle) {
        this.libelle = libelle;
    }

    public boolean isPrincipal() {
        return principal;
    }

    public void setPrincipal(boolean principal) {
        this.principal = principal;
    }
}
