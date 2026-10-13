package com.finco.controller;

import com.finco.dto.FournisseurRequest;
import com.finco.dto.FournisseurResponse;
import com.finco.service.FournisseurService;
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

@RestController
@RequestMapping("/api/fournisseurs")
public class FournisseurController {

    private final FournisseurService fournisseurService;

    public FournisseurController(FournisseurService fournisseurService) {
        this.fournisseurService = fournisseurService;
    }

    @GetMapping
    public List<FournisseurResponse> lister() {
        return fournisseurService.findAll();
    }

    @GetMapping("/{id}")
    public FournisseurResponse detail(@PathVariable Long id) {
        return fournisseurService.findById(id);
    }

    @PostMapping
    public ResponseEntity<FournisseurResponse> ajouter(@Valid @RequestBody FournisseurRequest request) {
        FournisseurResponse cree = fournisseurService.create(request);
        URI uri = URI.create("/api/fournisseurs/" + cree.id());
        return ResponseEntity.created(uri).body(cree);
    }

    @PutMapping("/{id}")
    public FournisseurResponse modifier(@PathVariable Long id, @Valid @RequestBody FournisseurRequest request) {
        return fournisseurService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void supprimer(@PathVariable Long id) {
        fournisseurService.delete(id);
    }
}
