package com.finco.repository;

import com.finco.entity.AllocationPaiement;
import com.finco.entity.AllocationPaiementId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.math.BigDecimal;

@Repository
public interface AllocationPaiementRepository extends JpaRepository<AllocationPaiement, AllocationPaiementId> {
    @Query("select a from AllocationPaiement a join fetch a.facture where a.paiement.id = :paiementId")
    List<AllocationPaiement> findAllByPaiementIdWithFacture(Long paiementId);

    @Query("select coalesce(sum(a.montantAffecte), 0) from AllocationPaiement a where a.facture.id = :factureId")
    BigDecimal totalAffecte(Long factureId);

    @Query("select coalesce(sum(a.montantAffecte), 0) from AllocationPaiement a "
            + "where a.facture.id = :factureId and a.paiement.validePar is not null")
    BigDecimal totalAffecteValide(Long factureId);

    boolean existsByFactureId(Long factureId);

    List<AllocationPaiement> findAllByPaiementId(Long paiementId);
}
