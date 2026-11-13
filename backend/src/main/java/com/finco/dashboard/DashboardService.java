package com.finco.dashboard;

import com.finco.dashboard.dto.AdminDashboardDto;
import com.finco.dashboard.dto.ComptableDashboardDto;
import com.finco.dashboard.dto.ControleurDashboardDto;
import com.finco.dashboard.dto.DashboardCentre;
import com.finco.dashboard.dto.DashboardKpi;
import com.finco.dashboard.dto.DashboardMonthly;
import com.finco.dashboard.dto.DirecteurDashboardDto;
import com.finco.entity.Budget;
import com.finco.entity.Exercice;
import com.finco.entity.enums.Role;
import com.finco.repository.BudgetRepository;
import com.finco.repository.CompteGeneralRepository;
import com.finco.repository.ExerciceRepository;
import com.finco.repository.FactureRepository;
import com.finco.repository.LigneEcritureRepository;
import com.finco.repository.PaiementRepository;
import com.finco.repository.PieceComptableRepository;
import com.finco.repository.UtilisateurRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    private static final BigDecimal ZERO = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
    private static final String PREFIXE_BANQUE = "514";
    private static final String PREFIXE_CAISSE = "516";

    private final ExerciceRepository exerciceRepository;
    private final PieceComptableRepository pieceRepository;
    private final LigneEcritureRepository ligneRepository;
    private final FactureRepository factureRepository;
    private final PaiementRepository paiementRepository;
    private final BudgetRepository budgetRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final CompteGeneralRepository compteRepository;

    public DashboardService(ExerciceRepository exerciceRepository, PieceComptableRepository pieceRepository,
                            LigneEcritureRepository ligneRepository, FactureRepository factureRepository,
                            PaiementRepository paiementRepository, BudgetRepository budgetRepository,
                            UtilisateurRepository utilisateurRepository, CompteGeneralRepository compteRepository) {
        this.exerciceRepository = exerciceRepository;
        this.pieceRepository = pieceRepository;
        this.ligneRepository = ligneRepository;
        this.factureRepository = factureRepository;
        this.paiementRepository = paiementRepository;
        this.budgetRepository = budgetRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.compteRepository = compteRepository;
    }

    @Transactional(readOnly = true)
    public ComptableDashboardDto comptable(Long exerciceId, LocalDate dateFrom, LocalDate dateTo, Long centreId) {
        Periode periode = periode(exerciceId, dateFrom, dateTo);
        Map<String, DashboardKpi> kpis = new LinkedHashMap<>();
        kpis.put("ecrituresValidees", kpi(pieceRepository.countByDateEcritureBetweenAndValideeTrue(periode.debut(), periode.fin()),
                pieceRepository.countByDateEcritureBetweenAndValideeTrue(periode.precedenteDebut(), periode.precedenteFin())));
        kpis.put("ecrituresEnAttente", kpi(pieceRepository.countByValideeFalse(), 0));
        kpis.put("facturesBrouillon", kpi(factureRepository.countByStatut(com.finco.entity.enums.StatutFacture.BROUILLON), 0));
        kpis.put("facturesImpayees", kpi(factureRepository.totalResteARegler(
            com.finco.entity.enums.TypeFacture.ACHAT, periode.debut(), periode.fin()), ZERO));
        kpis.put("paiements", kpi(paiementRepository.totalEntre(periode.debut(), periode.fin()),
                paiementRepository.totalEntre(periode.precedenteDebut(), periode.precedenteFin())));
        return new ComptableDashboardDto(periode.exercice().getAnnee(), Map.copyOf(kpis), monthly(periode), invoiceStatuses(periode));
    }

    @Transactional(readOnly = true)
    public ControleurDashboardDto controleur(Long exerciceId, LocalDate dateFrom, LocalDate dateTo, Long centreId) {
        Periode periode = periode(exerciceId, dateFrom, dateTo);
        BigDecimal actual = montant(ligneRepository.totalChargesValidees(periode.debut(), periode.fin(), centreId));
        BigDecimal previousActual = montant(ligneRepository.totalChargesValidees(periode.precedenteDebut(), periode.precedenteFin(), centreId));
        List<DashboardCentre> centres = centres(periode, centreId);
        BigDecimal budget = centres.stream().map(DashboardCentre::budget).reduce(ZERO, BigDecimal::add);
        Map<String, DashboardKpi> kpis = new LinkedHashMap<>();
        kpis.put("budgetTotal", kpi(budget, ZERO));
        kpis.put("reelTotal", kpi(actual, previousActual));
        kpis.put("ecartGlobal", kpi(actual.subtract(budget), previousActual.subtract(budget)));
        kpis.put("tauxConsommation", kpi(pourcentage(actual, budget), ZERO));
        kpis.put("centresEnDepassement", kpi(centres.stream().filter(c -> c.variance().signum() > 0).count(), 0));
        return new ControleurDashboardDto(periode.exercice().getAnnee(), Map.copyOf(kpis), monthly(periode), centres);
    }

    @Transactional(readOnly = true)
    public DirecteurDashboardDto directeur(Long exerciceId, LocalDate dateFrom, LocalDate dateTo, Long centreId) {
        Periode periode = periode(exerciceId, dateFrom, dateTo);
        BigDecimal revenue = montant(ligneRepository.totalProduitsValides(periode.debut(), periode.fin()));
        BigDecimal expenses = montant(ligneRepository.totalChargesValidees(periode.debut(), periode.fin(), centreId));
        BigDecimal previousRevenue = montant(ligneRepository.totalProduitsValides(periode.precedenteDebut(), periode.precedenteFin()));
        BigDecimal previousExpenses = montant(ligneRepository.totalChargesValidees(periode.precedenteDebut(), periode.precedenteFin(), centreId));
        Map<String, DashboardKpi> kpis = new LinkedHashMap<>();
        kpis.put("revenus", kpi(revenue, previousRevenue));
        kpis.put("charges", kpi(expenses, previousExpenses));
        kpis.put("resultatNet", kpi(revenue.subtract(expenses), previousRevenue.subtract(previousExpenses)));
        kpis.put("tresorerie", kpi(ligneRepository.soldeTresorerie(periode.debut(), periode.fin(), PREFIXE_BANQUE, PREFIXE_CAISSE), ZERO));
        kpis.put("creancesClients", kpi(factureRepository.totalResteARegler(
            com.finco.entity.enums.TypeFacture.VENTE, periode.debut(), periode.fin()), ZERO));
        kpis.put("dettesFournisseurs", kpi(factureRepository.totalResteARegler(
            com.finco.entity.enums.TypeFacture.ACHAT, periode.debut(), periode.fin()), ZERO));
        kpis.put("paiementsEnAttente", kpi(factureRepository.countByStatutAndType(
                com.finco.entity.enums.StatutFacture.VALIDEE, com.finco.entity.enums.TypeFacture.ACHAT), 0));
        return new DirecteurDashboardDto(periode.exercice().getAnnee(), Map.copyOf(kpis), monthly(periode), invoiceStatuses(periode));
    }

    @Transactional(readOnly = true)
    public AdminDashboardDto admin(Long exerciceId, LocalDate dateFrom, LocalDate dateTo, Long centreId) {
        Periode periode = periode(exerciceId, dateFrom, dateTo);
        Map<String, DashboardKpi> kpis = new LinkedHashMap<>();
        kpis.put("utilisateurs", kpi(utilisateurRepository.count(), 0));
        kpis.put("comptesGeneraux", kpi(compteRepository.count(), 0));
        kpis.put("ecritures", kpi(pieceRepository.countByDateEcritureBetweenAndValideeTrue(periode.debut(), periode.fin()), 0));
        Map<String, Long> usersByRole = new LinkedHashMap<>();
        for (Role role : Role.values()) {
            usersByRole.put(role.name(), utilisateurRepository.findAll().stream()
                    .filter(u -> u.getRole() == role).count());
        }
        return new AdminDashboardDto(periode.exercice().getAnnee(), Map.copyOf(kpis), Map.copyOf(usersByRole));
    }

    private List<DashboardMonthly> monthly(Periode periode) {
        Map<Integer, Object[]> finance = new HashMap<>();
        for (Object[] row : ligneRepository.totauxFinanciersParMois(periode.debut(), periode.fin())) {
            finance.put(((Number) row[0]).intValue(), row);
        }
        Map<Integer, Object[]> entries = new HashMap<>();
        for (Object[] row : pieceRepository.compterParMois(periode.debut(), periode.fin())) {
            entries.put(((Number) row[0]).intValue(), row);
        }
        Map<Integer, Object[]> payments = new HashMap<>();
        for (Object[] row : paiementRepository.totauxParMois(periode.debut(), periode.fin())) {
            payments.put(((Number) row[0]).intValue(), row);
        }
        List<DashboardMonthly> result = new ArrayList<>();
        for (int month = 1; month <= 12; month++) {
            Object[] f = finance.get(month);
            Object[] e = entries.get(month);
            Object[] p = payments.get(month);
            result.add(new DashboardMonthly(month,
                    f == null ? ZERO : montant((Number) f[1]), f == null ? ZERO : montant((Number) f[2]),
                    p == null ? ZERO : montant((Number) p[1]), p == null ? ZERO : montant((Number) p[2]),
                    e == null ? 0 : nombre(e[1]), e == null ? 0 : nombre(e[2])));
        }
        return result;
    }

    private List<DashboardCentre> centres(Periode periode, Long centreId) {
        Map<Long, Object[]> actuals = new HashMap<>();
        for (Object[] row : ligneRepository.chargesParCentre(periode.debut(), periode.fin(), centreId)) {
            actuals.put(((Number) row[0]).longValue(), row);
        }
        List<DashboardCentre> result = new ArrayList<>();
        for (Budget budget : budgetRepository.findAllByOrderByCentreCoutCodeAscAnneeDesc()) {
            if (budget.getAnnee() != periode.exercice().getAnnee()
                    || (centreId != null && !budget.getCentreCout().getId().equals(centreId))) continue;
            Object[] actualRow = actuals.get(budget.getCentreCout().getId());
            BigDecimal actual = actualRow == null ? ZERO : montant((Number) actualRow[3]);
            BigDecimal planned = montant(budget.getMontantPrevu());
            result.add(new DashboardCentre(budget.getCentreCout().getId(), budget.getCentreCout().getCode(),
                    budget.getCentreCout().getLibelle(), planned, actual, actual.subtract(planned), pourcentage(actual, planned)));
        }
        return result;
    }

    private Map<String, Long> invoiceStatuses(Periode periode) {
        Map<String, Long> result = new LinkedHashMap<>();
        for (Object[] row : factureRepository.compterParStatutEntre(periode.debut(), periode.fin())) {
            result.put(row[0].toString(), ((Number) row[1]).longValue());
        }
        return Map.copyOf(result);
    }

    private Periode periode(Long exerciceId, LocalDate dateFrom, LocalDate dateTo) {
        Exercice exercice = exerciceId == null
                ? exerciceRepository.findFirstByDateDebutLessThanEqualAndDateFinGreaterThanEqual(LocalDate.now(), LocalDate.now())
                .orElseThrow(() -> new IllegalArgumentException("Aucun exercice ne couvre la date courante."))
                : exerciceRepository.findById(exerciceId)
                .orElseThrow(() -> new IllegalArgumentException("Exercice introuvable."));
        LocalDate debut = dateFrom == null ? exercice.getDateDebut() : dateFrom.isBefore(exercice.getDateDebut()) ? exercice.getDateDebut() : dateFrom;
        LocalDate fin = dateTo == null ? exercice.getDateFin() : dateTo.isAfter(exercice.getDateFin()) ? exercice.getDateFin() : dateTo;
        if (fin.isBefore(debut)) throw new IllegalArgumentException("La période demandée est invalide.");
        long jours = fin.toEpochDay() - debut.toEpochDay() + 1;
        return new Periode(exercice, debut, fin, debut.minusDays(jours), debut.minusDays(1));
    }

    private DashboardKpi kpi(Number value, Number previous) {
        return kpi(montant(value), montant(previous));
    }

    private DashboardKpi kpi(BigDecimal value, BigDecimal previous) {
        BigDecimal current = montant(value);
        BigDecimal old = montant(previous);
        BigDecimal variation = old.signum() == 0 ? ZERO : current.subtract(old)
                .divide(old.abs(), 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP);
        return new DashboardKpi(current, old, variation);
    }

    private BigDecimal pourcentage(BigDecimal value, BigDecimal total) {
        return total.signum() == 0 ? ZERO : value.divide(total, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal montant(Number value) {
        return value == null ? ZERO : new BigDecimal(value.toString()).setScale(2, RoundingMode.HALF_UP);
    }

    private long nombre(Object value) {
        return value == null ? 0 : ((Number) value).longValue();
    }

    private record Periode(Exercice exercice, LocalDate debut, LocalDate fin,
                           LocalDate precedenteDebut, LocalDate precedenteFin) {
    }
}