package com.finco.service;

import com.finco.audit.ActionAudit;
import com.finco.audit.AuditService;
import com.finco.audit.DiffAudit;
import com.finco.dto.ImputationRequest;
import com.finco.dto.ImputationResponse;
import com.finco.entity.CentreCout;
import com.finco.entity.Imputation;
import com.finco.entity.LigneEcriture;
import com.finco.entity.enums.Sens;
import com.finco.exception.ConflitMetierException;
import com.finco.exception.RegleMetierException;
import com.finco.repository.CentreCoutRepository;
import com.finco.repository.ImputationRepository;
import com.finco.repository.LigneEcritureRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class ImputationService {

    private final ImputationRepository imputationRepository;
    private final LigneEcritureRepository ligneRepository;
    private final CentreCoutRepository centreRepository;
    private final AuditService auditService;

    public ImputationService(ImputationRepository imputationRepository,
                             LigneEcritureRepository ligneRepository,
                             CentreCoutRepository centreRepository,
                             AuditService auditService) {
        this.imputationRepository = imputationRepository;
        this.ligneRepository = ligneRepository;
        this.centreRepository = centreRepository;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<ImputationResponse> lister(String periode) {
        if (periode == null || periode.isBlank()) {
            return imputationRepository.findAll().stream().map(ImputationResponse::depuis).toList();
        }
        verifierPeriode(periode);
        return imputationRepository.findAllByPeriodeOrderByCentreSourceCodeAscCentreCibleCodeAsc(periode)
                .stream().map(ImputationResponse::depuis).toList();
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public List<ImputationResponse> repartir(ImputationRequest request) {
        if (request == null) throw new RegleMetierException("La période est obligatoire.");
        YearMonth periode = verifierPeriode(request.periode());
        List<LigneEcriture> lignes = ligneRepository.findChargesAuxiliairesValideesBetween(
                periode.atDay(1), periode.atEndOfMonth());
        Map<CentreCout, BigDecimal> chargesParSource = new LinkedHashMap<>();
        for (LigneEcriture ligne : lignes) {
            BigDecimal montantNet = ligne.getSens() == Sens.DEBIT
                    ? ligne.getMontant() : ligne.getMontant().negate();
            chargesParSource.merge(ligne.getCentreCout(), montantNet, BigDecimal::add);
        }
        chargesParSource.entrySet().removeIf(entree -> entree.getValue().signum() <= 0);

        List<CentreCout> cibles = centreRepository.findAllByPrincipalTrueOrderByCodeAsc().stream()
                .filter(c -> c.getCleRepartition() != null && c.getCleRepartition().signum() > 0)
                .toList();
        BigDecimal totalCles = cibles.stream().map(CentreCout::getCleRepartition)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (!chargesParSource.isEmpty() && totalCles.signum() <= 0) {
            throw new RegleMetierException("cleRepartition",
                    "Les centres principaux doivent avoir une clé de répartition positive.");
        }

        List<Imputation> nouvelles = new ArrayList<>();
        List<Map.Entry<CentreCout, BigDecimal>> sources = chargesParSource.entrySet().stream()
                .sorted(Map.Entry.comparingByKey((a, b) -> a.getId().compareTo(b.getId())))
                .toList();
        for (Map.Entry<CentreCout, BigDecimal> entree : sources) {
            CentreCout source = centreRepository.findByIdForUpdate(entree.getKey().getId())
                    .orElseThrow(() -> new RegleMetierException("Un centre auxiliaire n'existe plus."));
            if (imputationRepository.existsByPeriodeAndCentreSourceId(request.periode(), source.getId())) {
                throw new ConflitMetierException("Une répartition existe déjà pour le centre "
                        + source.getCode() + " et la période " + request.periode() + ".");
            }
            BigDecimal restant = entree.getValue().setScale(2, RoundingMode.HALF_UP);
            List<CentreCout> ciblesPositives = cibles;
            for (int i = 0; i < ciblesPositives.size(); i++) {
                CentreCout cible = ciblesPositives.get(i);
                BigDecimal part = i == ciblesPositives.size() - 1
                        ? restant
                        : entree.getValue().multiply(cible.getCleRepartition())
                                .divide(totalCles, 2, RoundingMode.HALF_UP);
                if (part.compareTo(restant) > 0) part = restant;
                if (part.signum() > 0) {
                    nouvelles.add(new Imputation(request.periode(), source, cible, part));
                    restant = restant.subtract(part);
                }
            }
        }
        List<Imputation> enregistrees = imputationRepository.saveAll(nouvelles);
        auditService.enregistrer(ActionAudit.REPARTITION_COUTS, "REPARTITION", null, "Période " + request.periode(),
                null,
                DiffAudit.json(Map.of(
                        "periode", request.periode(),
                        "nombreImputations", enregistrees.size())),
                "Répartition des coûts pour la période " + request.periode());
        return enregistrees.stream().map(ImputationResponse::depuis).toList();
    }

    private YearMonth verifierPeriode(String valeur) {
        try {
            if (valeur == null || !valeur.matches("\\d{4}-\\d{2}")) throw new DateTimeParseException("", "", 0);
            YearMonth periode = YearMonth.parse(valeur);
            if (periode.getYear() < 2000 || periode.getYear() > 2099) {
                throw new RegleMetierException("periode", "L'année doit être comprise entre 2000 et 2099.");
            }
            return periode;
        } catch (DateTimeParseException e) {
            throw new RegleMetierException("periode", "La période doit respecter le format AAAA-MM.");
        }
    }
}
