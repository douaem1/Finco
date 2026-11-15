package com.finco.audit;

import java.time.LocalDateTime;

/** Critères de recherche du journal d'audit (tous optionnels). */
public record AuditFiltres(
        LocalDateTime dateFrom,
        LocalDateTime dateTo,
        Long utilisateurId,
        ActionAudit action,
        CategorieAudit categorie,
        String entiteType,
        ResultatAudit resultat,
        String texte) {

    public static AuditFiltres vides() {
        return new AuditFiltres(null, null, null, null, null, null, null, null);
    }
}
