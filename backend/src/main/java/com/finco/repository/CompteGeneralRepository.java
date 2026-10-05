package com.finco.repository;

import com.finco.entity.CompteGeneral;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/** Accès au plan comptable. */
@Repository
public interface CompteGeneralRepository extends JpaRepository<CompteGeneral, Long> {

    /** Plan comptable trié par numéro (pour la liste déroulante de saisie). */
    List<CompteGeneral> findAllByOrderByNumeroAsc();
}
