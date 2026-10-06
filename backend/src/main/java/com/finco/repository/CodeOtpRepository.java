package com.finco.repository;

import com.finco.entity.CodeOtp;
import com.finco.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/** Accès aux codes OTP. */
@Repository
public interface CodeOtpRepository extends JpaRepository<CodeOtp, Long> {

    Optional<CodeOtp> findByJeton(String jeton);

    /** Invalide les codes encore actifs d'un utilisateur (un seul code valable à la fois). */
    @Modifying
    @Query("UPDATE CodeOtp c SET c.utilise = true WHERE c.utilisateur = :utilisateur AND c.utilise = false")
    void invaliderCodesActifs(Utilisateur utilisateur);
}
