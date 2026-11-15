package com.finco.audit;

/** Nombre d'événements par utilisateur (top utilisateurs). */
public record AuditUtilisateurStat(String nom, String role, long nombre) {
}
