package com.finco.dto;

/** Informations publiques de l'utilisateur connecté (jamais le mot de passe). */
public record UtilisateurDto(String email, String nom, String prenom, String role) {
}
