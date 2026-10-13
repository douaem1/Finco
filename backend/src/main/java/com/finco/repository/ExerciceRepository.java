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

    /** Vérifie l'unicité de l'année à la création. */
    boolean existsByAnnee(int annee);

    /** Vérifie l'unicité de l'année à la modification (exclut l'id courant). */
    boolean existsByAnneeAndIdNot(int annee, Long id);

    /** Liste triée par année décroissante pour l'affichage. */
    java.util.List<Exercice> findAllByOrderByAnneeDesc();

    /** Deux exercices ne peuvent pas se chevaucher : existe-t-il un exercice qui recoupe [debut ; fin] ? */
    @org.springframework.data.jpa.repository.Query("""
            SELECT COUNT(e) > 0 FROM Exercice e
            WHERE e.dateDebut <= :fin AND e.dateFin >= :debut
              AND (:idExclu IS NULL OR e.id <> :idExclu)
            """)
    boolean chevauche(LocalDate debut, LocalDate fin, Long idExclu);

    /** Reste-t-il un exercice antérieur non clôturé ? (clôture dans l'ordre chronologique) */
    boolean existsByDateFinBeforeAndClotureFalse(LocalDate date);

    /** Exercice d'une année donnée (pour savoir si son budget est encore modifiable). */
    Optional<Exercice> findByAnnee(int annee);
}
