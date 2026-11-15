package com.finco.audit;

import java.util.List;

/** Résultat d'un export du journal d'audit (borné à {@code max} lignes). */
public record AuditExportResponse(
        List<AuditEventResponse> content,
        long totalElements,
        boolean tronque) {
}
