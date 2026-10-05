package com.finco.service;

import com.finco.entity.CompteGeneral;
import com.finco.repository.CompteGeneralRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/** Consultation du plan comptable (utilisé par le formulaire de saisie). */
@Service
@Transactional(readOnly = true)
public class CompteGeneralService {

    private final CompteGeneralRepository compteGeneralRepository;

    public CompteGeneralService(CompteGeneralRepository compteGeneralRepository) {
        this.compteGeneralRepository = compteGeneralRepository;
    }

    public List<CompteGeneral> findAll() {
        return compteGeneralRepository.findAllByOrderByNumeroAsc();
    }
}
