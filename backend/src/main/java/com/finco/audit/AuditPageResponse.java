package com.finco.audit;

import java.util.List;

/** Enveloppe paginée renvoyée par l'API d'audit. */
public record AuditPageResponse(
        List<AuditEventResponse> content,
        long totalElements,
        int totalPages) {
}
