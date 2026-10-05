package com.finco.dto;

import com.finco.entity.PieceComptable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Pièce renvoyée au frontend.
 * Pourquoi un DTO et pas l'entité ? L'entité contient des relations LAZY
 * (exercice, utilisateur, lignes -> piece -> lignes...) : la sérialiser en JSON
 * provoquerait des boucles infinies et exposerait le hachage du mot de passe.
 */
public record PieceComptableResponse(Long id, String numero, LocalDate dateEcriture, String libelle,
                                     boolean validee, int exercice, String saisiePar,
                                     BigDecimal totalDebit, BigDecimal totalCredit,
                                     List<LigneEcritureResponse> lignes) {

    public static PieceComptableResponse depuis(PieceComptable p) {
        return new PieceComptableResponse(
                p.getId(),
                p.getNumero(),
                p.getDateEcriture(),
                p.getLibelle(),
                p.isValidee(),
                p.getExercice().getAnnee(),
                p.getUtilisateur().getNomComplet(),
                p.totalDebit(),
                p.totalCredit(),
                p.getLignes().stream().map(LigneEcritureResponse::depuis).toList());
    }
}
