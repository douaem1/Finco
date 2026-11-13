package com.finco.dashboard;

import com.finco.dashboard.dto.ControleurDashboardDto;
import com.finco.entity.Budget;
import com.finco.entity.CentreCout;
import com.finco.entity.Exercice;
import com.finco.repository.BudgetRepository;
import com.finco.repository.CompteGeneralRepository;
import com.finco.repository.ExerciceRepository;
import com.finco.repository.FactureRepository;
import com.finco.repository.LigneEcritureRepository;
import com.finco.repository.PaiementRepository;
import com.finco.repository.PieceComptableRepository;
import com.finco.repository.UtilisateurRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock private ExerciceRepository exerciceRepository;
    @Mock private PieceComptableRepository pieceRepository;
    @Mock private LigneEcritureRepository ligneRepository;
    @Mock private FactureRepository factureRepository;
    @Mock private PaiementRepository paiementRepository;
    @Mock private BudgetRepository budgetRepository;
    @Mock private UtilisateurRepository utilisateurRepository;
    @Mock private CompteGeneralRepository compteRepository;

    private DashboardService service;

    @BeforeEach
    void setUp() {
        service = new DashboardService(exerciceRepository, pieceRepository, ligneRepository,
                factureRepository, paiementRepository, budgetRepository, utilisateurRepository, compteRepository);
    }

    @Test
    void controleurCalculeEcartEtConsommationAvecDouzeMois() {
        Exercice exercice = new Exercice(2026, LocalDate.of(2026, 1, 1), LocalDate.of(2026, 12, 31));
        CentreCout centre = new CentreCout("PROD", "Production", true);
        centre.setId(10L);
        Budget budget = new Budget(2026, new BigDecimal("1000.00"), centre);

        when(exerciceRepository.findById(1L)).thenReturn(Optional.of(exercice));
        when(ligneRepository.totalChargesValidees(exercice.getDateDebut(), exercice.getDateFin(), null))
                .thenReturn(new BigDecimal("1200.00"));
        when(ligneRepository.totalChargesValidees(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 12, 31), null))
                .thenReturn(new BigDecimal("800.00"));
        when(ligneRepository.chargesParCentre(exercice.getDateDebut(), exercice.getDateFin(), null))
                .thenReturn(List.<Object[]>of(new Object[]{10L, "PROD", "Production", new BigDecimal("1200.00")}));
        when(ligneRepository.totauxFinanciersParMois(exercice.getDateDebut(), exercice.getDateFin()))
                .thenReturn(List.<Object[]>of());
        when(pieceRepository.compterParMois(exercice.getDateDebut(), exercice.getDateFin()))
                .thenReturn(List.<Object[]>of());
        when(paiementRepository.totauxParMois(exercice.getDateDebut(), exercice.getDateFin()))
                .thenReturn(List.<Object[]>of());
        when(factureRepository.compterParStatutEntre(exercice.getDateDebut(), exercice.getDateFin()))
                .thenReturn(List.<Object[]>of());
        when(budgetRepository.findAllByOrderByCentreCoutCodeAscAnneeDesc()).thenReturn(List.of(budget));

        ControleurDashboardDto result = service.controleur(1L, null, null, null);

        assertEquals(new BigDecimal("200.00"), result.kpis().get("ecartGlobal").value());
        assertEquals(new BigDecimal("120.00"), result.kpis().get("tauxConsommation").value());
        assertEquals(1, result.centres().size());
        assertEquals(12, result.monthly().size());
        assertEquals(BigDecimal.ZERO.setScale(2), result.monthly().get(0).expenses());
    }
}