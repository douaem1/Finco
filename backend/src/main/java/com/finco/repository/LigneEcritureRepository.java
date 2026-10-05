package com.finco.repository;

import com.finco.entity.LigneEcriture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/** Accès aux lignes d'écriture. */
@Repository
public interface LigneEcritureRepository extends JpaRepository<LigneEcriture, Long> {

    /** Un centre de coûts est-il déjà utilisé dans une écriture ? (avant suppression) */
    boolean existsByCentreCoutId(Long centreCoutId);
}
