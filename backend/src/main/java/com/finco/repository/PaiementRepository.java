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

@Repository
public interface PaiementRepository extends JpaRepository<Paiement, Long> {
    List<Paiement> findAllByOrderByDatePaiementDescIdDesc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Paiement p where p.id = :id")
    Optional<Paiement> findByIdForUpdate(@Param("id") Long id);
}
