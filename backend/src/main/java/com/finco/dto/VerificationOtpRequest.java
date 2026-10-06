package com.finco.dto;

/** Étape 2 — POST /api/auth/verifier-otp : { "jetonOtp": "...", "code": "123456" }. */
public record VerificationOtpRequest(String jetonOtp, String code) {
}
