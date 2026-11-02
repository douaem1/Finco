package com.finco.dto;

import com.finco.entity.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UtilisateurModificationRequest(
        @NotBlank(message = "Le nom est obligatoire.")
        @Size(max = 100, message = "Le nom ne doit pas dépasser 100 caractères.")
        String nom,

        @NotBlank(message = "Le prénom est obligatoire.")
        @Size(max = 100, message = "Le prénom ne doit pas dépasser 100 caractères.")
        String prenom,

        @NotBlank(message = "L'email est obligatoire.")
        @Email(message = "Adresse email invalide.")
        @Size(max = 150, message = "L'email ne doit pas dépasser 150 caractères.")
        String email,

        @Size(min = 8, max = 100, message = "Le mot de passe doit comporter entre 8 et 100 caractères.")
        String motDePasse,

        @NotNull(message = "Le rôle est obligatoire.")
        Role role,

        @NotNull(message = "Le statut est obligatoire.")
        Boolean actif
) {
}
