package com.finco.repository;

import com.finco.entity.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/** Accès aux utilisateurs. Implémentation générée par Spring Data JPA. */
@Repository
public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {

    /** SELECT * FROM utilisateur WHERE email = ? — utilisé à la connexion. */
    Optional<Utilisateur> findByEmail(String email);
}
