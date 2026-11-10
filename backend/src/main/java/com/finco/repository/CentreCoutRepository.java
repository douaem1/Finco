package com.finco.repository;

import com.finco.entity.CentreCout;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Couche d'accès aux données pour les centres de coûts.
 *
 * C'est une simple INTERFACE : nous n'écrivons aucune implémentation.
 * Au démarrage, Spring Data JPA génère une classe qui l'implémente et
 * l'enregistre comme Bean dans le conteneur Spring (IoC).
 * Ce Bean sera ensuite injecté par constructeur dans CentreCoutService.
 *
 * JpaRepository<CentreCout, Long> fournit déjà : findAll, findById, save,
 * deleteById, existsById, count...
 */
@Repository
public interface CentreCoutRepository extends JpaRepository<CentreCout, Long> {

    /**
     * Requête dérivée du nom de la méthode :
     * Spring génère « SELECT COUNT(*) > 0 FROM centre_cout WHERE code = ? ».
     * Utilisée par le service pour refuser un code en double à la création.
     */
    boolean existsByCode(String code);

    /**
     * Même vérification, mais en excluant le centre en cours de modification :
     * « ... WHERE code = ? AND id <> ? ».
     * Sans elle, modifier un centre sans changer son code serait refusé
     * à tort (le centre se trouverait lui-même comme doublon).
     */
    boolean existsByCodeAndIdNot(String code, Long id);

    java.util.List<CentreCout> findAllByPrincipalTrueOrderByCodeAsc();

    java.util.List<CentreCout> findAllByPrincipalFalseOrderByCodeAsc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from CentreCout c where c.id = :id")
    java.util.Optional<CentreCout> findByIdForUpdate(@Param("id") Long id);
}
