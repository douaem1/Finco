package com.finco.controller;

import com.finco.dto.RapportAnalytiqueResponse;
import com.finco.service.RapportAnalytiqueService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rapports/analytique")
public class RapportAnalytiqueController {

    private final RapportAnalytiqueService service;

    public RapportAnalytiqueController(RapportAnalytiqueService service) {
        this.service = service;
    }

    @GetMapping
    public RapportAnalytiqueResponse obtenir(@RequestParam int annee) {
        return service.obtenir(annee);
    }
}
