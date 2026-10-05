package com.finco.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * Corps de POST /api/pieces.
 * Exemple :
 * { "dateEcriture": "2026-10-05", "libelle": "Loyer octobre",
 *   "lignes": [ { "compteId": 7, "centreCoutId": 2, "sens": "DEBIT",  "montant": 9000 },
 *               { "compteId": 5, "centreCoutId": null, "sens": "CREDIT", "montant": 9000 } ] }
 */
public record PieceComptableRequest(LocalDate dateEcriture, String libelle, List<LigneEcritureRequest> lignes) {
}
