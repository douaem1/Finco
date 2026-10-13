package com.finco.service;

import com.finco.dto.CompteGeneralRequest;
import com.finco.dto.CompteGeneralResponse;
import com.finco.entity.CompteGeneral;
import com.finco.exception.ConflitMetierException;
import com.finco.exception.RegleMetierException;
import com.finco.exception.RessourceIntrouvableException;
import com.finco.repository.CompteGeneralRepository;
import com.finco.repository.LigneEcritureRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Couche MÉTIER pour la gestion du plan comptable (CompteGeneral).
 */
@Service
@Transactional
public class CompteGeneralService {

    private final CompteGeneralRepository compteGeneralRepository;
    private final LigneEcritureRepository ligneEcritureRepository;

    public CompteGeneralService(CompteGeneralRepository compteGeneralRepository,
                                LigneEcritureRepository ligneEcritureRepository) {
        this.compteGeneralRepository = compteGeneralRepository;
        this.ligneEcritureRepository = ligneEcritureRepository;
    }

    @Transactional(readOnly = true)
    public List<CompteGeneralResponse> findAll() {
        return compteGeneralRepository.findAllByOrderByNumeroAsc().stream()
                .map(CompteGeneralResponse::de)
                .toList();
    }

    @Transactional(readOnly = true)
    public CompteGeneralResponse findById(Long id) {
        return CompteGeneralResponse.de(getCompteOuErreur(id));
    }

    public CompteGeneralResponse create(CompteGeneralRequest request) {
        String numero = validerNumero(request.numero());
        String libelle = validerLibelle(request.libelle());

        if (compteGeneralRepository.existsByNumero(numero)) {
            throw new ConflitMetierException("Le numéro de compte « " + numero + " » existe déjà.");
        }

        int classe = calculerClasse(numero);
        CompteGeneral compte = new CompteGeneral(numero, libelle, classe);
        CompteGeneral enregistre = compteGeneralRepository.save(compte);
        return CompteGeneralResponse.de(enregistre);
    }

    public CompteGeneralResponse update(Long id, CompteGeneralRequest request) {
        CompteGeneral compte = getCompteOuErreur(id);
        String nouveauNumero = validerNumero(request.numero());
        String nouveauLibelle = validerLibelle(request.libelle());

        boolean numeroChange = !compte.getNumero().equals(nouveauNumero);
        if (numeroChange) {
            if (ligneEcritureRepository.existsByCompteId(id)) {
                throw new ConflitMetierException("Le compte « " + compte.getNumero()
                        + " » est utilisé dans des écritures comptables : modification de son numéro impossible.");
            }
            if (compteGeneralRepository.existsByNumeroAndIdNot(nouveauNumero, id)) {
                throw new ConflitMetierException("Le numéro de compte « " + nouveauNumero + " » est déjà utilisé par un autre compte.");
            }
        }

        compte.setNumero(nouveauNumero);
        compte.setLibelle(nouveauLibelle);
        compte.setClasse(calculerClasse(nouveauNumero));

        CompteGeneral misAJour = compteGeneralRepository.save(compte);
        return CompteGeneralResponse.de(misAJour);
    }

    public void delete(Long id) {
        CompteGeneral compte = getCompteOuErreur(id);
        if (ligneEcritureRepository.existsByCompteId(id)) {
            throw new ConflitMetierException("Le compte « " + compte.getNumero()
                    + " » est utilisé dans des écritures comptables : suppression impossible.");
        }
        compteGeneralRepository.delete(compte);
    }

    private CompteGeneral getCompteOuErreur(Long id) {
        return compteGeneralRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Compte général introuvable (id = " + id + ")."));
    }

    private String validerNumero(String numero) {
        if (numero == null || numero.isBlank()) {
            throw new RegleMetierException("Le numéro de compte est obligatoire.");
        }
        String nettoye = numero.trim();
        if (!nettoye.matches("^[1-8][0-9]{1,9}$")) {
            throw new RegleMetierException("Le numéro de compte doit comporter entre 2 et 10 chiffres et commencer par un chiffre entre 1 et 8.");
        }
        return nettoye;
    }

    private String validerLibelle(String libelle) {
        if (libelle == null || libelle.isBlank()) {
            throw new RegleMetierException("Le libellé du compte est obligatoire.");
        }
        String nettoye = libelle.trim();
        if (nettoye.length() > 150) {
            throw new RegleMetierException("Le libellé ne doit pas dépasser 150 caractères.");
        }
        return nettoye;
    }

    /** La classe est calculée côté serveur à partir du premier chiffre du numéro (1 à 8). */
    private int calculerClasse(String numero) {
        return Character.getNumericValue(numero.charAt(0));
    }
}
