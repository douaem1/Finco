package com.finco.audit;

import java.util.List;
import java.util.Map;

/** Statistiques agrégées du journal d'audit sur une période. */
public record AuditStatistiquesResponse(
        long total,
        long echecs,
        String utilisateurPlusActif,
        String utilisateurPlusActifRole,
        String categoriePrincipale,
        String categoriePrincipaleLibelle,
        List<AuditUtilisateurStat> topUtilisateurs,
        Map<String, Long> parCategorie) {
}
