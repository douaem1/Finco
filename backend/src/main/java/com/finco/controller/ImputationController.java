package com.finco.controller;

import com.finco.dto.ImputationRequest;
import com.finco.dto.ImputationResponse;
import com.finco.service.ImputationService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/imputations")
public class ImputationController {

    private final ImputationService service;

    public ImputationController(ImputationService service) {
        this.service = service;
    }

    @GetMapping
    public List<ImputationResponse> lister(@RequestParam(required = false) String periode) {
        return service.lister(periode);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public List<ImputationResponse> repartir(@RequestBody ImputationRequest request) {
        return service.repartir(request);
    }
}
