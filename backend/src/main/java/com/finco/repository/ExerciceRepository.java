package com.finco.repository;

import com.finco.entity.Exercice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

/** Accès aux exercices comptables. */
@Repository
public interface ExerciceRepository extends JpaRepository<Exercice, Long> {

    /**
     * Exercice qui contient une date :
     * « WHERE date_debut <= ? AND date_fin >= ? ».
     * On passe la même date deux fois.
     */
    Optional<Exercice> findFirstByDateDebutLessThanEqualAndDateFinGreaterThanEqual(LocalDate date1, LocalDate date2);
}
