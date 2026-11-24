package com.finco.service;

import com.finco.dto.RapportAnalytiqueResponse;
import com.finco.entity.Budget;
import com.finco.entity.Imputation;
import com.finco.entity.LigneEcriture;
import com.finco.entity.enums.Sens;
import com.finco.exception.RegleMetierException;
import com.finco.repository.BudgetRepository;
import com.finco.repository.CentreCoutRepository;
import com.finco.repository.ImputationRepository;
import com.finco.repository.LigneEcritureRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class RapportAnalytiqueService {

    private final LigneEcritureRepository ligneRepository;
    private final BudgetRepository budgetRepository;
    private final ImputationRepository imputationRepository;
    private final CentreCoutRepository centreCoutRepository;

    public RapportAnalytiqueService(LigneEcritureRepository ligneRepository, BudgetRepository budgetRepository,
                                    ImputationRepository imputationRepository,
                                    CentreCoutRepository centreCoutRepository) {
        this.ligneRepository = ligneRepository;
        this.budgetRepository = budgetRepository;
        this.imputationRepository = imputationRepository;
        this.centreCoutRepository = centreCoutRepository;
    }

    @Transactional(readOnly = true)
    public RapportAnalytiqueResponse obtenir(int annee) {
        if (annee < 2000 || annee > 2099) {
            throw new RegleMetierException("annee", "L'année doit être comprise entre 2000 et 2099.");
        }
        List<LigneEcriture> lignes = ligneRepository.findAllValideesBetween(
                LocalDate.of(annee, 1, 1), LocalDate.of(annee, 12, 31));
        BigDecimal totalCharges = BigDecimal.ZERO;
        BigDecimal totalProduits = BigDecimal.ZERO;
        Map<Long, BigDecimal> reelsParCentre = new HashMap<>();
        Map<YearMonth, BigDecimal[]> parMois = new HashMap<>();

        for (LigneEcriture ligne : lignes) {
            int classe = ligne.getCompte().getClasse();
            YearMonth mois = YearMonth.from(ligne.getPiece().getDateEcriture());
            BigDecimal[] totaux = parMois.computeIfAbsent(mois, ignored -> new BigDecimal[]{
                    BigDecimal.ZERO, BigDecimal.ZERO});
            if (classe == 6) {
                BigDecimal chargeNette = ligne.getSens() == Sens.DEBIT
                        ? ligne.getMontant() : ligne.getMontant().negate();
                totalCharges = totalCharges.add(chargeNette);
                totaux[0] = totaux[0].add(chargeNette);
                if (ligne.getCentreCout() != null) {
                    reelsParCentre.merge(ligne.getCentreCout().getId(), chargeNette, BigDecimal::add);
                }
            } else if (classe == 7) {
                BigDecimal produitNet = ligne.getSens() == Sens.CREDIT
                        ? ligne.getMontant() : ligne.getMontant().negate();
                totalProduits = totalProduits.add(produitNet);
                totaux[1] = totaux[1].add(produitNet);
            }
        }
        List<Imputation> imputations = imputationRepository
                .findAllByPeriodeStartingWithOrderByPeriodeAscCentreSourceCodeAsc(String.valueOf(annee));
        for (Imputation imputation : imputations) {
            reelsParCentre.merge(imputation.getCentreSource().getId(), imputation.getMontant().negate(), BigDecimal::add);
            reelsParCentre.merge(imputation.getCentreCible().getId(), imputation.getMontant(), BigDecimal::add);
        }

        Map<Long, Budget> budgets = new HashMap<>();
        for (Budget budget : budgetRepository.findAllByOrderByCentreCoutCodeAscAnneeDesc()) {
            if (budget.getAnnee() == annee) budgets.put(budget.getCentreCout().getId(), budget);
        }
        List<RapportAnalytiqueResponse.Centre> centres = centreCoutRepository.findAll(Sort.by("code")).stream()
                .map(centre -> {
                    Budget budget = budgets.get(centre.getId());
                    BigDecimal montantBudget = budget == null ? BigDecimal.ZERO : budget.getMontantPrevu();
                    BigDecimal reel = reelsParCentre.getOrDefault(centre.getId(), BigDecimal.ZERO);
                    return new RapportAnalytiqueResponse.Centre(
                            centre.getId(), centre.getCode(), centre.getLibelle(), montantBudget, reel,
                            reel.subtract(montantBudget));
                })
                .toList();

        List<RapportAnalytiqueResponse.Mois> evolution = new ArrayList<>();
        for (int mois = 1; mois <= 12; mois++) {
            YearMonth cle = YearMonth.of(annee, mois);
            BigDecimal[] valeurs = parMois.getOrDefault(cle, new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
            evolution.add(new RapportAnalytiqueResponse.Mois(cle.toString(), valeurs[0], valeurs[1]));
        }
        return new RapportAnalytiqueResponse(annee, totalCharges, totalProduits, centres, evolution);
    }
}
