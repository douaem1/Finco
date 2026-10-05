package com.finco.entity.enums;

/**
 * Les 4 rôles métier de FinCo.
 * Spring Security les manipule sous la forme "ROLE_COMPTABLE", "ROLE_ADMIN"...
 */
public enum Role {
    COMPTABLE,
    CONTROLEUR,
    DIRECTEUR_FINANCIER,
    ADMIN
}
