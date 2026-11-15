package com.finco.controller;

import com.finco.dto.PaiementDirectionResponse;
import com.finco.dto.RejetPaiementRequest;
import com.finco.service.PaiementDirectionService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/paiements")
public class PaiementDirectionController {
    private final PaiementDirectionService service;

    public PaiementDirectionController(PaiementDirectionService service) {
        this.service = service;
    }

    @PutMapping("/{id}/valider")
    public PaiementDirectionResponse valider(@PathVariable Long id,
                                             org.springframework.security.core.Authentication authentication) {
        return service.valider(id, authentication.getName());
    }

    @PatchMapping("/{id}/rejeter")
    public PaiementDirectionResponse rejeter(@PathVariable Long id,
                                             @Valid @RequestBody RejetPaiementRequest request,
                                             org.springframework.security.core.Authentication authentication) {
        return service.rejeter(id, request.motif(), authentication.getName());
    }
}
