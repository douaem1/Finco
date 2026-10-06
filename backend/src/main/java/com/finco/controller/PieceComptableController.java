package com.finco.controller;

import com.finco.dto.PieceComptableRequest;
import com.finco.dto.PieceComptableResponse;
import com.finco.service.PieceComptableService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * API des écritures comptables.
 *  GET  /api/pieces       journal des pièces
 *  GET  /api/pieces/{id}  détail d'une pièce
 *  POST /api/pieces       saisie (rôle COMPTABLE ou ADMIN, cf. SecurityConfig)
 */
@RestController
@RequestMapping("/api/pieces")
public class PieceComptableController {

    private final PieceComptableService pieceComptableService;

    public PieceComptableController(PieceComptableService pieceComptableService) {
        this.pieceComptableService = pieceComptableService;
    }

    @GetMapping
    public List<PieceComptableResponse> lister() {
        return pieceComptableService.findAll();
    }

    @GetMapping("/{id}")
    public PieceComptableResponse detail(@PathVariable Long id) {
        return pieceComptableService.findById(id);
    }

    /** L'email du saisisseur vient du jeton (jamais du corps de la requête). */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PieceComptableResponse saisir(@RequestBody PieceComptableRequest requete, Authentication authentification) {
        return pieceComptableService.create(requete, authentification.getName());
    }
}
