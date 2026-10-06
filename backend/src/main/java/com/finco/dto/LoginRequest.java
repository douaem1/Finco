package com.finco.dto;

/** Étape 1 — POST /api/auth/login : { "email": "...", "motDePasse": "..." }. */
public record LoginRequest(String email, String motDePasse) {
}
