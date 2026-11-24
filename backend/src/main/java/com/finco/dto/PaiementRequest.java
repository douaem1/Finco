package com.finco.dto;

import java.time.LocalDate;
import java.util.List;

public record PaiementRequest(LocalDate datePaiement, String mode, List<AllocationPaiementRequest> allocations) {
}
