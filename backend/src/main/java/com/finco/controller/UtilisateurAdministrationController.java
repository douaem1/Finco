package com.finco.controller;

import com.finco.dto.UtilisateurAdministrationResponse;
import com.finco.dto.UtilisateurCreationRequest;
import com.finco.dto.UtilisateurModificationRequest;
import com.finco.service.UtilisateurAdministrationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/utilisateurs")
public class UtilisateurAdministrationController {

    private final UtilisateurAdministrationService service;

    public UtilisateurAdministrationController(UtilisateurAdministrationService service) {
        this.service = service;
    }

    @GetMapping
    public List<UtilisateurAdministrationResponse> lister() {
        return service.findAll();
    }

    @PostMapping
    public ResponseEntity<UtilisateurAdministrationResponse> creer(
            @Valid @RequestBody UtilisateurCreationRequest request) {
        UtilisateurAdministrationResponse cree = service.create(request);
        return ResponseEntity.created(URI.create("/api/utilisateurs/" + cree.id())).body(cree);
    }

    @PutMapping("/{id}")
    public UtilisateurAdministrationResponse modifier(
            @PathVariable Long id, @Valid @RequestBody UtilisateurModificationRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void supprimer(@PathVariable Long id) {
        service.delete(id);
    }
}
