package com.finco.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public record AssistantChatRequest(
        @NotEmpty(message = "La conversation ne peut pas être vide.")
        @Size(max = 8, message = "La conversation est trop longue.")
        List<@NotNull @Valid Message> messages
) {
    public record Message(
            @NotBlank
            @Pattern(regexp = "user|assistant", message = "Le rôle du message est invalide.")
            String role,
            @NotBlank
            @Size(max = 1600, message = "Un message ne peut pas dépasser 1 600 caractères.")
            String content
    ) {
    }
}
