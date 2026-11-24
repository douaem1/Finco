package com.finco.controller;

import com.finco.dto.PaiementDirectionResponse;
import com.finco.dto.PaiementRequest;
import com.finco.service.PaiementDirectionService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/paiements")
public class PaiementController {

    private final PaiementDirectionService service;

    public PaiementController(PaiementDirectionService service) {
        this.service = service;
    }

    @GetMapping
    public List<PaiementDirectionResponse> lister() {
        return service.lister();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PaiementDirectionResponse creer(@RequestBody PaiementRequest request) {
        return service.creer(request);
    }
}
