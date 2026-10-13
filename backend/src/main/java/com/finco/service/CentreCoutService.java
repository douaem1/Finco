package com.finco.service;

import com.finco.entity.CentreCout;
import com.finco.exception.ConflitMetierException;
import com.finco.exception.RegleMetierException;
import com.finco.exception.RessourceIntrouvableException;
import com.finco.repository.BudgetRepository;
import com.finco.repository.CentreCoutRepository;
import com.finco.repository.LigneEcritureRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Couche MÉTIER des centres de coûts : toutes les règles sont ici.
 */
@Service
@Transactional
public class CentreCoutService {

    private static final int CODE_LONGUEUR_MIN = 2;
    private static final int CODE_LONGUEUR_MAX = 10;
    private static final int LIBELLE_LONGUEUR_MAX = 100;

    private final CentreCoutRepository centreCoutRepository;
    private final LigneEcritureRepository ligneEcritureRepository;
    private final BudgetRepository budgetRepository;

    public CentreCoutService(CentreCoutRepository centreCoutRepository,
                             LigneEcritureRepository ligneEcritureRepository,
                             BudgetRepository budgetRepository) {
        this.centreCoutRepository = centreCoutRepository;
        this.ligneEcritureRepository = ligneEcritureRepository;
        this.budgetRepository = budgetRepository;
    }

    @Transactional(readOnly = true)
    public List<CentreCout> findAll() {
        return centreCoutRepository.findAll(Sort.by("code"));
    }

    @Transactional(readOnly = true)
    public CentreCout findById(Long id) {
        return centreCoutRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Centre de coûts introuvable (id = " + id + ")."));
    }

    public CentreCout create(CentreCout donnees) {
        String code = verifierCode(donnees);
        String libelle = verifierLibelle(donnees);

        if (centreCoutRepository.existsByCode(code)) {
            throw new ConflitMetierException("Le code « " + code + " » existe déjà.");
        }

        CentreCout centre = new CentreCout(code, libelle, donnees.isPrincipal());
        return centreCoutRepository.save(centre);
    }

    public CentreCout update(Long id, CentreCout donnees) {
        CentreCout centre = findById(id);
        String code = verifierCode(donnees);
        String libelle = verifierLibelle(donnees);

        // Unicité en excluant le centre modifié lui-même.
        if (centreCoutRepository.existsByCodeAndIdNot(code, id)) {
            throw new ConflitMetierException("Le code « " + code + " » est déjà utilisé par un autre centre.");
        }

        centre.setCode(code);
        centre.setLibelle(libelle);
        centre.setPrincipal(donnees.isPrincipal());
        return centreCoutRepository.save(centre);
    }

    public void delete(Long id) {
        CentreCout centre = findById(id);
        if (ligneEcritureRepository.existsByCentreCoutId(id)) {
            throw new ConflitMetierException("Le centre « " + centre.getCode()
                    + " » est utilisé dans des écritures comptables : suppression impossible.");
        }
        if (budgetRepository.existsByCentreCoutId(id)) {
            throw new ConflitMetierException("Le centre « " + centre.getCode()
                    + " » possède un budget associé : suppression impossible.");
        }
        centreCoutRepository.delete(centre);
    }

    // ---------------------------------------------------------------- règles

    /** Règle : code obligatoire, 2 à 10 caractères (lettres majuscules, chiffres et underscore). */
    private String verifierCode(CentreCout donnees) {
        if (donnees == null || donnees.getCode() == null || donnees.getCode().isBlank()) {
            throw new RegleMetierException("Le code du centre de coûts est obligatoire.");
        }
        String code = donnees.getCode().trim().toUpperCase();
        if (code.length() < CODE_LONGUEUR_MIN || code.length() > CODE_LONGUEUR_MAX) {
            throw new RegleMetierException("Le code doit comporter entre " + CODE_LONGUEUR_MIN + " et " + CODE_LONGUEUR_MAX + " caractères.");
        }
        if (!code.matches("^[A-Z0-9_]{2,10}$")) {
            throw new RegleMetierException("Le code ne doit contenir que des lettres majuscules, des chiffres et le caractère de soulignement.");
        }
        return code;
    }

    /** Règle : libellé obligatoire, 100 caractères max. */
    private String verifierLibelle(CentreCout donnees) {
        if (donnees == null || donnees.getLibelle() == null || donnees.getLibelle().isBlank()) {
            throw new RegleMetierException("Le libellé du centre de coûts est obligatoire.");
        }
        String libelle = donnees.getLibelle().trim();
        if (libelle.length() > LIBELLE_LONGUEUR_MAX) {
            throw new RegleMetierException("Le libellé ne doit pas dépasser " + LIBELLE_LONGUEUR_MAX + " caractères.");
        }
        return libelle;
    }
}
