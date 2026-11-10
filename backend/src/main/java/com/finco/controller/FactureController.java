package com.finco.controller;

import com.finco.dto.FactureRequest;
import com.finco.dto.FactureResponse;
import com.finco.dto.FactureValidationRequest;
import com.finco.service.FactureService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/factures")
public class FactureController {

    private final FactureService service;

    public FactureController(FactureService service) {
        this.service = service;
    }

    @GetMapping
    public List<FactureResponse> lister() {
        return service.lister();
    }

    @GetMapping("/{id}")
    public FactureResponse obtenir(@PathVariable Long id) {
        return service.obtenir(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FactureResponse creer(@RequestBody FactureRequest request) {
        return service.creer(request);
    }

    @PutMapping("/{id}")
    public FactureResponse modifier(@PathVariable Long id, @RequestBody FactureRequest request) {
        return service.modifier(id, request);
    }

    @PatchMapping("/{id}/valider")
    public FactureResponse valider(@PathVariable Long id, @RequestBody(required = false) FactureValidationRequest request,
                                   Authentication authentication) {
        return service.valider(id, request, authentication.getName());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void supprimer(@PathVariable Long id) {
        service.supprimer(id);
    }
}
