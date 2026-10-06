package com.finco.dto;

/** POST /api/auth/renvoyer-otp : { "jetonOtp": "..." }. */
public record RenvoiOtpRequest(String jetonOtp) {
}
