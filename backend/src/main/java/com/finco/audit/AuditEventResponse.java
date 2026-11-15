package com.finco.audit;

import java.time.LocalDateTime;

/** Vue d'un événement d'audit exposée par l'API (jamais l'entité). */
public record AuditEventResponse(
        Long id,
        LocalDateTime dateEvenement,
        Long utilisateurId,
        String utilisateurNom,
        String utilisateurRole,
        String action,
        String actionLibelle,
        String categorie,
        String categorieLibelle,
        String entiteType,
        Long entiteId,
        String entiteReference,
        String ancienneValeur,
        String nouvelleValeur,
        String details,
        String resultat,
        String resultatLibelle,
        String adresseIp,
        String requestId) {

    public static AuditEventResponse depuis(AuditEvent e) {
        ActionAudit action = e.getAction();
        return new AuditEventResponse(
                e.getId(),
                e.getDateEvenement(),
                e.getUtilisateurId(),
                e.getUtilisateurNom(),
                e.getUtilisateurRole(),
                action != null ? action.name() : null,
                action != null ? action.libelle() : null,
                action != null ? action.categorie().name() : null,
                action != null ? action.categorie().libelle() : null,
                e.getEntiteType(),
                e.getEntiteId(),
                e.getEntiteReference(),
                e.getAncienneValeur(),
                e.getNouvelleValeur(),
                e.getDetails(),
                e.getResultat() != null ? e.getResultat().name() : null,
                e.getResultat() != null ? e.getResultat().libelle() : null,
                e.getAdresseIp(),
                e.getRequestId());
    }
}
