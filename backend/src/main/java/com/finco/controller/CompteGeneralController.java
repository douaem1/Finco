package com.finco.controller;

import com.finco.dto.CompteGeneralRequest;
import com.finco.dto.CompteGeneralResponse;
import com.finco.service.CompteGeneralService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

/**
 * API REST pour la gestion du plan comptable (CompteGeneral).
 */
@RestController
@RequestMapping("/api/comptes")
public class CompteGeneralController {

    private final CompteGeneralService compteGeneralService;

    public CompteGeneralController(CompteGeneralService compteGeneralService) {
        this.compteGeneralService = compteGeneralService;
    }

    @GetMapping
    public List<CompteGeneralResponse> lister() {
        return compteGeneralService.findAll();
    }

    @GetMapping("/{id}")
    public CompteGeneralResponse detail(@PathVariable Long id) {
        return compteGeneralService.findById(id);
    }

    @PostMapping
    public ResponseEntity<CompteGeneralResponse> ajouter(@Valid @RequestBody CompteGeneralRequest request) {
        CompteGeneralResponse cree = compteGeneralService.create(request);
        URI uri = URI.create("/api/comptes/" + cree.id());
        return ResponseEntity.created(uri).body(cree);
    }

    @PutMapping("/{id}")
    public CompteGeneralResponse modifier(@PathVariable Long id, @Valid @RequestBody CompteGeneralRequest request) {
        return compteGeneralService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void supprimer(@PathVariable Long id) {
        compteGeneralService.delete(id);
    }
}
