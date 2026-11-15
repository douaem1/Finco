package com.finco.service;

import com.finco.dto.BalanceResponse;
import com.finco.dto.CompteBalance;
import com.finco.dto.CompteGrandLivre;
import com.finco.dto.GrandLivreResponse;
import com.finco.entity.CompteGeneral;
import com.finco.entity.LigneEcriture;
import com.finco.entity.enums.Sens;
import com.finco.repository.CompteGeneralRepository;
import com.finco.repository.LigneEcritureRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Grand livre et balance des comptes.
 *
 * Recalculé à partir des MÊMES données que l'interface (lignes des pièces
 * VALIDÉES) afin de rester cohérent avec l'affichage : aucune règle comptable
 * nouvelle, simple agrégation débit / crédit.
 */
@Service
@Transactional(readOnly = true)
public class GrandLivreService {

    private static final LocalDate DEBUT_LARGE = LocalDate.of(1900, 1, 1);
    private static final LocalDate FIN_LARGE = LocalDate.of(2999, 12, 31);

    private final LigneEcritureRepository ligneRepository;
    private final CompteGeneralRepository compteRepository;

    public GrandLivreService(LigneEcritureRepository ligneRepository, CompteGeneralRepository compteRepository) {
        this.ligneRepository = ligneRepository;
        this.compteRepository = compteRepository;
    }

    /** Grand livre : si compteNumero est fourni, un seul compte, sinon tous les comptes mouvementés. */
    public GrandLivreResponse grandLivre(String compteNumero, LocalDate dateFrom, LocalDate dateTo) {
        List<LigneEcriture> toutes = ligneRepository.findAllValideesBetween(DEBUT_LARGE, FIN_LARGE);
        List<CompteGeneral> comptes = compteRepository.findAllByOrderByNumeroAsc();

        List<CompteGrandLivre> resultat = new ArrayList<>();
        BigDecimal totalDebit = BigDecimal.ZERO;
        BigDecimal totalCredit = BigDecimal.ZERO;

        for (CompteGeneral compte : comptes) {
            if (compteNumero != null && !compteNumero.isBlank() && !compte.getNumero().equals(compteNumero)) {
                continue;
            }
            List<LigneEcriture> duCompte = toutes.stream()
                    .filter(l -> l.getCompte().getNumero().equals(compte.getNumero()))
                    .toList();
            if (duCompte.isEmpty()) {
                continue;
            }

            BigDecimal ouverture = duCompte.stream()
                    .filter(l -> estAvant(l, dateFrom))
                    .map(this::signe)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            List<LigneEcriture> periode = duCompte.stream()
                    .filter(l -> dansPeriode(l, dateFrom, dateTo))
                    .sorted(Comparator.comparing((LigneEcriture l) -> l.getPiece().getDateEcriture())
                            .thenComparing(l -> l.getPiece().getNumero()))
                    .toList();

            BigDecimal solde = ouverture;
            List<CompteGrandLivre.LigneGrandLivre> lignes = new ArrayList<>();
            BigDecimal debitCompte = BigDecimal.ZERO;
            BigDecimal creditCompte = BigDecimal.ZERO;
            for (LigneEcriture l : periode) {
                BigDecimal d = l.getSens() == Sens.DEBIT ? l.getMontant() : BigDecimal.ZERO;
                BigDecimal c = l.getSens() == Sens.CREDIT ? l.getMontant() : BigDecimal.ZERO;
                debitCompte = debitCompte.add(d);
                creditCompte = creditCompte.add(c);
                solde = solde.add(d).subtract(c);
                lignes.add(new CompteGrandLivre.LigneGrandLivre(
                        l.getPiece().getDateEcriture(),
                        l.getPiece().getNumero(),
                        l.getPiece().getId(),
                        l.getPiece().getLibelle(),
                        l.getCentreCout() == null ? null : l.getCentreCout().getCode(),
                        d, c, solde));
            }
            if (lignes.isEmpty()) {
                continue;
            }
            totalDebit = totalDebit.add(debitCompte);
            totalCredit = totalCredit.add(creditCompte);
            resultat.add(new CompteGrandLivre(compte.getNumero(), compte.getLibelle(), ouverture, lignes,
                    debitCompte, creditCompte, solde));
        }
        return new GrandLivreResponse(resultat, totalDebit, totalCredit, dateFrom, dateTo);
    }

    /** Balance des comptes sur la période (tous les comptes du plan). */
    public BalanceResponse balance(LocalDate dateFrom, LocalDate dateTo) {
        List<LigneEcriture> toutes = ligneRepository.findAllValideesBetween(DEBUT_LARGE, FIN_LARGE);
        Map<String, BigDecimal[]> totaux = new LinkedHashMap<>();
        for (LigneEcriture l : toutes) {
            if (!dansPeriode(l, dateFrom, dateTo)) {
                continue;
            }
            BigDecimal[] cumul = totaux.computeIfAbsent(l.getCompte().getNumero(),
                    ignored -> new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
            if (l.getSens() == Sens.DEBIT) {
                cumul[0] = cumul[0].add(l.getMontant());
            } else {
                cumul[1] = cumul[1].add(l.getMontant());
            }
        }

        List<CompteBalance> comptes = new ArrayList<>();
        BigDecimal totalDebit = BigDecimal.ZERO;
        BigDecimal totalCredit = BigDecimal.ZERO;
        for (CompteGeneral compte : compteRepository.findAllByOrderByNumeroAsc()) {
            BigDecimal[] cumul = totaux.get(compte.getNumero());
            if (cumul == null) {
                continue;
            }
            BigDecimal solde = cumul[0].subtract(cumul[1]);
            comptes.add(new CompteBalance(compte.getNumero(), compte.getLibelle(), cumul[0], cumul[1],
                    solde.signum() >= 0 ? solde : BigDecimal.ZERO,
                    solde.signum() < 0 ? solde.abs() : BigDecimal.ZERO));
            totalDebit = totalDebit.add(cumul[0]);
            totalCredit = totalCredit.add(cumul[1]);
        }
        boolean equilibree = totalDebit.compareTo(totalCredit) == 0;
        return new BalanceResponse(comptes, totalDebit, totalCredit, equilibree, dateFrom, dateTo);
    }

    // ------------------------------------------------------------------

    private BigDecimal signe(LigneEcriture l) {
        return l.getSens() == Sens.DEBIT ? l.getMontant() : l.getMontant().negate();
    }

    private boolean estAvant(LigneEcriture l, LocalDate dateFrom) {
        return dateFrom != null && l.getPiece().getDateEcriture().isBefore(dateFrom);
    }

    private boolean dansPeriode(LigneEcriture l, LocalDate dateFrom, LocalDate dateTo) {
        LocalDate date = l.getPiece().getDateEcriture();
        return (dateFrom == null || !date.isBefore(dateFrom)) && (dateTo == null || !date.isAfter(dateTo));
    }
}
