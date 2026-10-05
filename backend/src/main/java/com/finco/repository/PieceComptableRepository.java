package com.finco.repository;

import com.finco.entity.PieceComptable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/** Accès aux pièces comptables. */
@Repository
public interface PieceComptableRepository extends JpaRepository<PieceComptable, Long> {

    /**
     * Journal : toutes les pièces, les plus récentes d'abord, chargées AVEC leurs
     * lignes, comptes, centres, exercice et auteur en UNE requête (JOIN FETCH).
     * Sans cela, Hibernate ferait une requête par pièce et par ligne (problème « N+1 »).
     */
    @Query("""
            SELECT DISTINCT p FROM PieceComptable p
            JOIN FETCH p.exercice
            JOIN FETCH p.utilisateur
            LEFT JOIN FETCH p.lignes l
            LEFT JOIN FETCH l.compte
            LEFT JOIN FETCH l.centreCout
            ORDER BY p.dateEcriture DESC, p.id DESC
            """)
    List<PieceComptable> findAllAvecLignes();

    /** Dernier numéro attribué pour une année, ex. préfixe "PC-2026-". */
    Optional<PieceComptable> findFirstByNumeroStartingWithOrderByNumeroDesc(String prefixe);

    /** Une pièce avec tout son détail, en une seule requête. */
    @Query("""
            SELECT DISTINCT p FROM PieceComptable p
            JOIN FETCH p.exercice
            JOIN FETCH p.utilisateur
            LEFT JOIN FETCH p.lignes l
            LEFT JOIN FETCH l.compte
            LEFT JOIN FETCH l.centreCout
            WHERE p.id = :id
            """)
    Optional<PieceComptable> findAvecLignes(Long id);
}
