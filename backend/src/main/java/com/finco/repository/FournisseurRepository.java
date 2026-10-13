package com.finco.repository;

import com.finco.entity.Fournisseur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FournisseurRepository extends JpaRepository<Fournisseur, Long> {

    List<Fournisseur> findAllByOrderByNomAsc();

    /** Unicité de l'ICE (identifiant commun de l'entreprise) parmi les fournisseurs. */
    boolean existsByIce(String ice);

    /** Même contrôle à la modification, en excluant le tiers modifié. */
    boolean existsByIceAndIdNot(String ice, Long id);
}
