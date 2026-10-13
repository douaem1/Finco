package com.finco.controller;

import com.finco.dto.ExerciceRequest;
import com.finco.dto.ExerciceResponse;
import com.finco.service.ExerciceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur REST des exercices comptables.
 *
 * GET    /api/exercices          → liste tous les exercices (tri année DESC)
 * GET    /api/exercices/{id}     → détail d'un exercice
 * POST   /api/exercices          → crée un exercice (ADMIN ou COMPTABLE)
 * PUT    /api/exercices/{id}     → modifie un exercice (ADMIN ou COMPTABLE)
 * PATCH  /api/exercices/{id}/cloturer → clôture un exercice (ADMIN)
 * DELETE /api/exercices/{id}     → supprime un exercice (ADMIN)
 */
@RestController
@RequestMapping("/api/exercices")
public class ExerciceController {

    private final ExerciceService exerciceService;

    public ExerciceController(ExerciceService exerciceService) {
        this.exerciceService = exerciceService;
    }

    @GetMapping
    public List<ExerciceResponse> listerTous() {
        return exerciceService.findAll();
    }

    @GetMapping("/{id}")
    public ExerciceResponse obtenir(@PathVariable Long id) {
        return exerciceService.findById(id);
    }

    @PostMapping
    public ResponseEntity<ExerciceResponse> creer(@Valid @RequestBody ExerciceRequest request) {
        ExerciceResponse cree = exerciceService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(cree);
    }

    @PutMapping("/{id}")
    public ExerciceResponse modifier(@PathVariable Long id,
                                     @Valid @RequestBody ExerciceRequest request) {
        return exerciceService.update(id, request);
    }

    @PatchMapping("/{id}/cloturer")
    public ExerciceResponse cloturer(@PathVariable Long id) {
        return exerciceService.cloturer(id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        exerciceService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
