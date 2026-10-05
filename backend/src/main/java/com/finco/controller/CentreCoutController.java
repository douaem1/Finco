package com.finco.controller;

import com.finco.entity.CentreCout;
import com.finco.service.CentreCoutService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Couche PRÉSENTATION (API REST) des centres de coûts.
 *
 * Elle ne connaît QUE le service : jamais le repository, et aucune règle
 * métier. Son rôle : traduire HTTP <-> appels Java.
 */
@RestController
@RequestMapping("/api/centres-cout")
public class CentreCoutController {

    private final CentreCoutService centreCoutService;

    /** Injection par constructeur : Spring fournit le Bean CentreCoutService. */
    public CentreCoutController(CentreCoutService centreCoutService) {
        this.centreCoutService = centreCoutService;
    }

    @GetMapping
    public List<CentreCout> lister() {
        return centreCoutService.findAll();
    }

    @GetMapping("/{id}")
    public CentreCout detail(@PathVariable Long id) {
        return centreCoutService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CentreCout ajouter(@RequestBody CentreCout centre) {
        return centreCoutService.create(centre);
    }

    @PutMapping("/{id}")
    public CentreCout modifier(@PathVariable Long id, @RequestBody CentreCout centre) {
        return centreCoutService.update(id, centre);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void supprimer(@PathVariable Long id) {
        centreCoutService.delete(id);
    }
}
