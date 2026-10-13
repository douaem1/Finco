package com.finco.dto;

import com.finco.entity.Exercice;

import java.time.LocalDate;

public record ExerciceResponse(
        Long id,
        int annee,
        LocalDate dateDebut,
        LocalDate dateFin,
        boolean cloture,
        Long societeId,
        String raisonSociale
) {
    /** Fabrique un ExerciceResponse à partir d'une entité Exercice. */
    public static ExerciceResponse de(Exercice e) {
        Long sid = (e.getSociete() != null) ? e.getSociete().getId() : null;
        String rs  = (e.getSociete() != null) ? e.getSociete().getRaisonSociale() : null;
        return new ExerciceResponse(
                e.getId(),
                e.getAnnee(),
                e.getDateDebut(),
                e.getDateFin(),
                e.isCloture(),
                sid,
                rs
        );
    }
}
