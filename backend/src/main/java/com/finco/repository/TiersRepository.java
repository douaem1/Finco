package com.finco.repository;

import com.finco.entity.Tiers;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

@Repository
public interface TiersRepository extends JpaRepository<Tiers, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Tiers t where t.id = :id")
    Optional<Tiers> findByIdForUpdate(@Param("id") Long id);
}
