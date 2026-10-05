package com.finco.dto;

/** Informations publiques de l'utilisateur connecté (jamais le mot de passe). */
public record UtilisateurDto(String login, String nomComplet, String role) {
}
