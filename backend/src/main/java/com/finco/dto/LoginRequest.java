package com.finco.dto;

/** Corps de POST /api/auth/login : { "login": "...", "motDePasse": "..." }. */
public record LoginRequest(String login, String motDePasse) {
}
