package com.finco.controller;

import com.finco.entity.CompteGeneral;
import com.finco.service.CompteGeneralService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** GET /api/comptes : plan comptable (liste déroulante du formulaire de saisie). */
@RestController
@RequestMapping("/api/comptes")
public class CompteGeneralController {

    private final CompteGeneralService compteGeneralService;

    public CompteGeneralController(CompteGeneralService compteGeneralService) {
        this.compteGeneralService = compteGeneralService;
    }

    @GetMapping
    public List<CompteGeneral> lister() {
        return compteGeneralService.findAll();
    }
}
