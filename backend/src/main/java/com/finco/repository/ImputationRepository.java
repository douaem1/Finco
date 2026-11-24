package com.finco.repository;

import com.finco.entity.Imputation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImputationRepository extends JpaRepository<Imputation, Long> {
    boolean existsByPeriodeAndCentreSourceId(String periode, Long centreSourceId);

    List<Imputation> findAllByPeriodeOrderByCentreSourceCodeAscCentreCibleCodeAsc(String periode);

    List<Imputation> findAllByPeriodeStartingWithOrderByPeriodeAscCentreSourceCodeAsc(String annee);
}
