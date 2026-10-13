package com.finco.controller;

import com.finco.dto.BudgetRequest;
import com.finco.dto.BudgetResponse;
import com.finco.service.BudgetService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Contrôleur REST des budgets CO.
 *
 * GET    /api/budgets                          → liste tous les budgets
 * GET    /api/budgets/{id}                     → détail d'un budget
 * GET    /api/budgets/centre/{centreCoutId}    → budgets d'un centre
 * POST   /api/budgets                          → crée un budget (CONTROLEUR ou ADMIN)
 * PUT    /api/budgets/{id}                     → modifie un budget (CONTROLEUR ou ADMIN)
 * DELETE /api/budgets/{id}                     → supprime un budget (CONTROLEUR ou ADMIN)
 */
@RestController
@RequestMapping("/api/budgets")
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @GetMapping
    public List<BudgetResponse> listerTous() {
        return budgetService.findAll();
    }

    @GetMapping("/{id}")
    public BudgetResponse obtenir(@PathVariable Long id) {
        return budgetService.findById(id);
    }

    @GetMapping("/centre/{centreCoutId}")
    public List<BudgetResponse> listerParCentre(@PathVariable Long centreCoutId) {
        return budgetService.findByCentreCout(centreCoutId);
    }

    @PostMapping
    public ResponseEntity<BudgetResponse> creer(@Valid @RequestBody BudgetRequest request) {
        BudgetResponse cree = budgetService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(cree);
    }

    @PutMapping("/{id}")
    public BudgetResponse modifier(@PathVariable Long id,
                                   @Valid @RequestBody BudgetRequest request) {
        return budgetService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        budgetService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
