package com.finco.notification;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

/** Accès aux notifications, toujours filtré par destinataire. */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByDestinataireIdOrderByDateCreationDesc(Long destinataireId, Pageable pageable);

    Page<Notification> findByDestinataireIdAndLuFalseOrderByDateCreationDesc(Long destinataireId, Pageable pageable);

    long countByDestinataireIdAndLuFalse(Long destinataireId);

    /** Marquage groupé en lu : un seul UPDATE au lieu d'un par notification. */
    @Modifying
    @Query("UPDATE Notification n SET n.lu = true "
            + "WHERE n.destinataire.id = :destinataireId AND n.lu = false")
    int toutMarquerLu(@Param("destinataireId") Long destinataireId);

    /**
     * Purge des notifications lues anciennes. Méthode prête mais volontairement
     * non planifiée : à brancher plus tard si besoin.
     */
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.lu = true AND n.dateCreation < :limite")
    int supprimerLuesAvant(@Param("limite") LocalDateTime limite);
}
