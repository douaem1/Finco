package com.finco.dto;

/**
 * Réponse de l'étape 1 : le mot de passe est correct, un code a été envoyé.
 * @param jetonOtp           à renvoyer avec le code à l'étape 2
 * @param emailMasque        ex. "s***a@finco.ma" (pour l'affichage)
 * @param validiteSecondes   durée de validité du code
 * @param renvoiDansSecondes délai avant de pouvoir redemander un code
 */
public record OtpEnvoyeResponse(String jetonOtp, String emailMasque, long validiteSecondes, long renvoiDansSecondes) {
}
