package com.finco.dto;

import com.finco.entity.enums.Sens;

import java.math.BigDecimal;

/** Une ligne saisie dans le formulaire : on envoie des ids, pas des objets complets. */
public record LigneEcritureRequest(Long compteId, Long centreCoutId, Sens sens, BigDecimal montant) {
}
