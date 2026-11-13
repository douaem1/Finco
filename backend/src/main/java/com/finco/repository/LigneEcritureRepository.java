package com.finco.repository;

import com.finco.entity.LigneEcriture;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.math.BigDecimal;

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

    @Query(value = """
            SELECT MONTH(p.date_ecriture) AS mois,
                   COALESCE(SUM(CASE WHEN c.classe = 7 AND l.sens = 'CREDIT' THEN l.montant ELSE 0 END), 0) AS produits,
                   COALESCE(SUM(CASE WHEN c.classe = 6 AND l.sens = 'DEBIT' THEN l.montant ELSE 0 END), 0) AS charges
            FROM ligne_ecriture l
            JOIN piece_comptable p ON p.id = l.piece_id
            JOIN compte_general c ON c.id = l.compte_id
            WHERE p.validee = true AND p.date_ecriture BETWEEN :debut AND :fin
            GROUP BY MONTH(p.date_ecriture)
            ORDER BY MONTH(p.date_ecriture)
            """, nativeQuery = true)
    List<Object[]> totauxFinanciersParMois(@Param("debut") LocalDate debut, @Param("fin") LocalDate fin);

    @Query("""
            select coalesce(sum(l.montant), 0) from LigneEcriture l
            join l.piece p join l.compte c
            where p.validee = true and c.classe = 6 and l.sens = com.finco.entity.enums.Sens.DEBIT
              and p.dateEcriture between :debut and :fin
              and (:centreId is null or l.centreCout.id = :centreId)
            """)
    BigDecimal totalChargesValidees(@Param("debut") LocalDate debut, @Param("fin") LocalDate fin,
                                    @Param("centreId") Long centreId);

    @Query("""
            select coalesce(sum(l.montant), 0) from LigneEcriture l
            join l.piece p join l.compte c
            where p.validee = true and c.classe = 7 and l.sens = com.finco.entity.enums.Sens.CREDIT
              and p.dateEcriture between :debut and :fin
            """)
    BigDecimal totalProduitsValides(@Param("debut") LocalDate debut, @Param("fin") LocalDate fin);

                @Query(value = """
                                                SELECT COALESCE(SUM(CASE WHEN l.sens = 'DEBIT' THEN l.montant ELSE -l.montant END), 0)
                                                FROM ligne_ecriture l
                                                JOIN piece_comptable p ON p.id = l.piece_id
                                                JOIN compte_general c ON c.id = l.compte_id
                                                WHERE p.validee = true AND p.date_ecriture BETWEEN :debut AND :fin
                                                        AND (c.numero LIKE CONCAT(:banque, '%') OR c.numero LIKE CONCAT(:caisse, '%'))
                                                """, nativeQuery = true)
                BigDecimal soldeTresorerie(@Param("debut") LocalDate debut, @Param("fin") LocalDate fin,
                                                                                                                         @Param("banque") String banque, @Param("caisse") String caisse);

    @Query("""
            select l.centreCout.id, l.centreCout.code, l.centreCout.libelle,
                   coalesce(sum(l.montant), 0)
            from LigneEcriture l join l.piece p join l.compte c
            where p.validee = true and c.classe = 6 and l.sens = com.finco.entity.enums.Sens.DEBIT
              and l.centreCout is not null and p.dateEcriture between :debut and :fin
              and (:centreId is null or l.centreCout.id = :centreId)
            group by l.centreCout.id, l.centreCout.code, l.centreCout.libelle
            order by sum(l.montant) desc
            """)
    List<Object[]> chargesParCentre(@Param("debut") LocalDate debut, @Param("fin") LocalDate fin,
                                    @Param("centreId") Long centreId);
}
