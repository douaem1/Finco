package com.finco.repository;

import com.finco.entity.Facture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.Optional;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface FactureRepository extends JpaRepository<Facture, Long> {

    /** Vérifie si un tiers possède des factures avant de tenter sa suppression. */
    boolean existsByTiersId(Long tiersId);

    boolean existsByTiersIdAndNumero(Long tiersId, String numero);

    java.util.List<Facture> findAllByOrderByDateFactureDescIdDesc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select f from Facture f join fetch f.tiers where f.id = :id")
    Optional<Facture> findByIdForUpdate(@Param("id") Long id);

        long countByStatut(com.finco.entity.enums.StatutFacture statut);

        long countByDateFactureBetween(LocalDate debut, LocalDate fin);

        @Query("select f.statut, count(f) from Facture f group by f.statut")
        List<Object[]> compterParStatut();

        @Query("select f.statut, count(f) from Facture f where f.dateFacture between :debut and :fin group by f.statut")
        List<Object[]> compterParStatutEntre(@Param("debut") LocalDate debut, @Param("fin") LocalDate fin);

        @Query("""
                        select coalesce(sum((f.montantHT * (1 + f.tauxTVA / 100)) -
                                (select coalesce(sum(a.montantAffecte), 0) from AllocationPaiement a where a.facture = f)), 0)
                        from Facture f
                        where f.type = :type and f.statut = com.finco.entity.enums.StatutFacture.VALIDEE
                            and f.dateFacture between :debut and :fin
                        """)
        java.math.BigDecimal totalResteARegler(@Param("type") com.finco.entity.enums.TypeFacture type,
                                                                                     @Param("debut") LocalDate debut, @Param("fin") LocalDate fin);

        @Query("""
                        select coalesce(sum(f.montantHT * (1 + f.tauxTVA / 100)), 0)
                        from Facture f
                        where f.type = com.finco.entity.enums.TypeFacture.VENTE
                            and f.statut <> com.finco.entity.enums.StatutFacture.BROUILLON
                            and f.dateFacture between :debut and :fin
                        """)
        java.math.BigDecimal totalVentes(@Param("debut") LocalDate debut, @Param("fin") LocalDate fin);

        @Query("""
                        select coalesce(sum(f.montantHT * (1 + f.tauxTVA / 100)), 0)
                        from Facture f
                        where f.type = com.finco.entity.enums.TypeFacture.ACHAT
                            and f.statut <> com.finco.entity.enums.StatutFacture.BROUILLON
                            and f.dateFacture between :debut and :fin
                        """)
        java.math.BigDecimal totalAchats(@Param("debut") LocalDate debut, @Param("fin") LocalDate fin);

        long countByStatutAndType(com.finco.entity.enums.StatutFacture statut,
                                                            com.finco.entity.enums.TypeFacture type);
}
