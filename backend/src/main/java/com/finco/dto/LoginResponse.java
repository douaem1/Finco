package com.finco.dto;

/** Réponse du login : le jeton JWT + l'utilisateur connecté. */
public record LoginResponse(String token, UtilisateurDto utilisateur) {
}
