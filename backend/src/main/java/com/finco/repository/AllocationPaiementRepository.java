package com.finco.repository;

import com.finco.entity.AllocationPaiement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

@Repository
public interface AllocationPaiementRepository extends JpaRepository<AllocationPaiement, Long> {
    @Query("select a from AllocationPaiement a join fetch a.facture where a.paiement.id = :paiementId")
    List<AllocationPaiement> findAllByPaiementIdWithFacture(Long paiementId);
}
