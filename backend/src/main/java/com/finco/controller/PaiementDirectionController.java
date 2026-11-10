package com.finco.controller;

import com.finco.dto.PaiementDirectionResponse;
import com.finco.service.PaiementDirectionService;
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
}
