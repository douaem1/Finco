package com.finco.dto;

import com.finco.entity.Utilisateur;

import java.time.LocalDateTime;

/** Représentation administrable, sans jamais exposer le mot de passe. */
public record UtilisateurAdministrationResponse(
        Long id,
        String nom,
        String prenom,
        String email,
        String role,
        boolean actif,
        LocalDateTime dateCreation
) {
    public static UtilisateurAdministrationResponse de(Utilisateur utilisateur) {
        return new UtilisateurAdministrationResponse(
                utilisateur.getId(),
                utilisateur.getNom(),
                utilisateur.getPrenom(),
                utilisateur.getEmail(),
                utilisateur.getRole().name(),
                utilisateur.isActif(),
                utilisateur.getDateCreation());
    }
}
