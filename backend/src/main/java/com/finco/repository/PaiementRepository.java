package com.finco.repository;

import com.finco.entity.Paiement;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.time.LocalDate;

@Repository
public interface PaiementRepository extends JpaRepository<Paiement, Long> {
    List<Paiement> findAllByOrderByDatePaiementDescIdDesc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Paiement p where p.id = :id")
    Optional<Paiement> findByIdForUpdate(@Param("id") Long id);

    @Query("select coalesce(sum(p.montant), 0) from Paiement p where p.datePaiement between :debut and :fin")
    java.math.BigDecimal totalEntre(@Param("debut") LocalDate debut, @Param("fin") LocalDate fin);

    @Query("""
            select coalesce(sum(case when f.type = com.finco.entity.enums.TypeFacture.VENTE then a.montantAffecte else 0 end), 0),
                   coalesce(sum(case when f.type = com.finco.entity.enums.TypeFacture.ACHAT then a.montantAffecte else 0 end), 0)
            from AllocationPaiement a join a.paiement p join a.facture f
            where p.datePaiement between :debut and :fin
            """)
    Object[] totauxRecettesDepenses(@Param("debut") LocalDate debut, @Param("fin") LocalDate fin);

    @Query(value = """
            SELECT MONTH(p.date_paiement) AS mois,
                   COALESCE(SUM(CASE WHEN f.type = 'VENTE' THEN a.montant_affecte ELSE 0 END), 0) AS recettes,
                   COALESCE(SUM(CASE WHEN f.type = 'ACHAT' THEN a.montant_affecte ELSE 0 END), 0) AS depenses
            FROM paiement_facture a
            JOIN paiement p ON p.id = a.paiement_id
            JOIN facture f ON f.id = a.facture_id
            WHERE p.date_paiement BETWEEN :debut AND :fin
            GROUP BY MONTH(p.date_paiement)
            ORDER BY MONTH(p.date_paiement)
            """, nativeQuery = true)
    java.util.List<Object[]> totauxParMois(@Param("debut") LocalDate debut, @Param("fin") LocalDate fin);
}
