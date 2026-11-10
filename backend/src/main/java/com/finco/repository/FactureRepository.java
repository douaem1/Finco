package com.finco.repository;

import com.finco.entity.Facture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.Optional;

@Repository
public interface FactureRepository extends JpaRepository<Facture, Long> {

    /** Vérifie si un tiers possède des factures avant de tenter sa suppression. */
    boolean existsByTiersId(Long tiersId);

    boolean existsByTiersIdAndNumero(Long tiersId, String numero);

    java.util.List<Facture> findAllByOrderByDateFactureDescIdDesc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select f from Facture f join fetch f.tiers where f.id = :id")
    Optional<Facture> findByIdForUpdate(@Param("id") Long id);
}
