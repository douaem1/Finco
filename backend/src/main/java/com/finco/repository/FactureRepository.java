package com.finco.repository;

import com.finco.entity.Facture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FactureRepository extends JpaRepository<Facture, Long> {

    /** Vérifie si un tiers possède des factures avant de tenter sa suppression. */
    boolean existsByTiersId(Long tiersId);
}
