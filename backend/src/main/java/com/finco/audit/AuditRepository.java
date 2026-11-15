package com.finco.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Accès au journal d'audit.
 *
 * Volontairement étendu à {@link Repository} (et non JpaRepository) : seules
 * les opérations d'ÉCRITURE (save) et de LECTURE sont déclarées. Aucun update,
 * aucun delete n'est exposé : le journal est immuable par construction.
 */
public interface AuditRepository extends Repository<AuditEvent, Long> {

    AuditEvent save(AuditEvent evenement);

    Optional<AuditEvent> findById(Long id);

    long count();

    @Query("SELECT a FROM AuditEvent a WHERE "
            + "a.dateEvenement >= :dateFrom AND "
            + "a.dateEvenement <= :dateTo AND "
            + "(:utilisateurId IS NULL OR a.utilisateurId = :utilisateurId) AND "
            + "(:action IS NULL OR a.action = :action) AND "
            + "(:resultat IS NULL OR a.resultat = :resultat) AND "
            + "(:entiteType IS NULL OR a.entiteType = :entiteType) AND "
            + "(:filtrerActions = false OR a.action IN :actions) AND "
            + "(:texte IS NULL OR LOWER(COALESCE(a.utilisateurNom, '')) LIKE :texte "
            + "OR LOWER(COALESCE(a.entiteReference, '')) LIKE :texte "
            + "OR LOWER(COALESCE(a.details, '')) LIKE :texte)")
    Page<AuditEvent> rechercher(@Param("dateFrom") LocalDateTime dateFrom,
                                @Param("dateTo") LocalDateTime dateTo,
                                @Param("utilisateurId") Long utilisateurId,
                                @Param("action") ActionAudit action,
                                @Param("resultat") ResultatAudit resultat,
                                @Param("entiteType") String entiteType,
                                @Param("filtrerActions") boolean filtrerActions,
                                @Param("actions") Collection<ActionAudit> actions,
                                @Param("texte") String texte,
                                Pageable pageable);

    List<AuditEvent> findByEntiteTypeAndEntiteIdOrderByDateEvenementDesc(String entiteType, Long entiteId);

    long countByDateEvenementBetween(LocalDateTime from, LocalDateTime to);

    long countByResultatAndDateEvenementBetween(ResultatAudit resultat, LocalDateTime from, LocalDateTime to);

    @Query("SELECT a.action, COUNT(a) FROM AuditEvent a "
            + "WHERE a.dateEvenement BETWEEN :from AND :to GROUP BY a.action")
    List<Object[]> compterParAction(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT a.utilisateurNom, a.utilisateurRole, COUNT(a) FROM AuditEvent a "
            + "WHERE a.dateEvenement BETWEEN :from AND :to AND a.utilisateurNom IS NOT NULL "
            + "GROUP BY a.utilisateurNom, a.utilisateurRole ORDER BY COUNT(a) DESC")
    List<Object[]> topUtilisateurs(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to, Pageable pageable);
}
