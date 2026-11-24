package com.finco.repository;

import com.finco.entity.LigneEcriture;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

/** Accès aux lignes d'écriture. */
@Repository
public interface LigneEcritureRepository extends JpaRepository<LigneEcriture, Long> {

    /** Un centre de coûts est-il déjà utilisé dans une écriture ? (avant suppression) */
    boolean existsByCentreCoutId(Long centreCoutId);

    /** Un compte général est-il déjà utilisé dans une écriture ? (avant modification/suppression) */
    boolean existsByCompteId(Long compteId);

    @Query("""
            select l from LigneEcriture l
            join fetch l.piece p
            join fetch l.compte c
            left join fetch l.centreCout cc
            where p.validee = true and p.dateEcriture between :debut and :fin
            """)
    List<LigneEcriture> findAllValideesBetween(@Param("debut") LocalDate debut, @Param("fin") LocalDate fin);

    @Query("""
            select l from LigneEcriture l
            join fetch l.piece p
            join fetch l.compte c
            join fetch l.centreCout cc
            where p.validee = true and p.dateEcriture between :debut and :fin
              and c.classe = 6 and cc.principal = false
            """)
    List<LigneEcriture> findChargesAuxiliairesValideesBetween(
            @Param("debut") LocalDate debut, @Param("fin") LocalDate fin);
}
