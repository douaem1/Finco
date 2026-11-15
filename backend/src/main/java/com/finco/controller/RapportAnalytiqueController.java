package com.finco.controller;

import com.finco.audit.ActionAudit;
import com.finco.audit.AuditService;
import com.finco.dto.RapportAnalytiqueResponse;
import com.finco.pdf.ContextePdf;
import com.finco.pdf.PdfService;
import com.finco.service.RapportAnalytiqueService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rapports/analytique")
public class RapportAnalytiqueController {

    private final RapportAnalytiqueService service;
    private final PdfService pdfService;
    private final ContextePdf contextePdf;
    private final AuditService auditService;

    public RapportAnalytiqueController(RapportAnalytiqueService service, PdfService pdfService,
                                       ContextePdf contextePdf, AuditService auditService) {
        this.service = service;
        this.pdfService = pdfService;
        this.contextePdf = contextePdf;
        this.auditService = auditService;
    }

    @GetMapping
    public RapportAnalytiqueResponse obtenir(@RequestParam int annee) {
        return service.obtenir(annee);
    }

    /** Export PDF du rapport budget vs réel (par centre de coûts). */
    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportPdf(@RequestParam int annee) {
        RapportAnalytiqueResponse rapport = service.obtenir(annee);

        List<Map<String, Object>> centres = new ArrayList<>();
        BigDecimal totalBudget = BigDecimal.ZERO;
        BigDecimal totalReel = BigDecimal.ZERO;
        for (RapportAnalytiqueResponse.Centre c : rapport.centres()) {
            BigDecimal budget = c.budget() != null ? c.budget() : BigDecimal.ZERO;
            BigDecimal reel = c.reel() != null ? c.reel() : BigDecimal.ZERO;
            double ratio = budget.signum() > 0 ? reel.doubleValue() / budget.doubleValue() : 0d;
            String statut;
            String statutClasse;
            if (ratio >= 1d) {
                statut = "Dépassement";
                statutClasse = "depassement";
            } else if (ratio >= 0.8d) {
                statut = "Attention";
                statutClasse = "attention";
            } else {
                statut = "OK";
                statutClasse = "ok";
            }
            long barrePourcent = Math.max(0, Math.min(100, Math.round(ratio * 100)));

            Map<String, Object> ligne = new HashMap<>();
            ligne.put("code", c.code());
            ligne.put("libelle", c.libelle());
            ligne.put("budget", budget);
            ligne.put("reel", reel);
            ligne.put("ecart", c.ecart() != null ? c.ecart() : reel.subtract(budget));
            ligne.put("consommation", compteur(ratio));
            ligne.put("statut", statut);
            ligne.put("statutClasse", statutClasse);
            ligne.put("barrePourcent", barrePourcent);
            centres.add(ligne);

            totalBudget = totalBudget.add(budget);
            totalReel = totalReel.add(reel);
        }

        Map<String, Object> modele = new HashMap<>();
        modele.put("societe", contextePdf.societe());
        modele.put("reference", "BUDGET-" + annee);
        modele.put("periode", "Exercice " + annee);
        modele.put("genereLe", contextePdf.maintenant());
        modele.put("par", contextePdf.nomUtilisateur() + " (" + contextePdf.roleUtilisateur() + ")");
        modele.put("exercice", String.valueOf(annee));
        modele.put("filtres", "Exercice " + annee);
        modele.put("empreinte", pdfService.empreinte(rapport));
        modele.put("annee", annee);
        modele.put("totalCharges", rapport.totalCharges());
        modele.put("totalProduits", rapport.totalProduits());
        modele.put("centres", centres);
        modele.put("totalBudget", totalBudget);
        modele.put("totalReel", totalReel);
        modele.put("etabliPar", contextePdf.nomUtilisateur());
        modele.put("etabliRole", contextePdf.roleUtilisateur());
        modele.put("verifiePar", null);
        modele.put("verifieRole", "Contrôleur de gestion");
        modele.put("approuvePar", null);

        byte[] pdf = pdfService.rendrePdf("rapport-analytique", modele);
        auditService.enregistrerExport(ActionAudit.EXPORT_PDF, "RAPPORT_ANALYTIQUE", "Budget vs réel " + annee,
                "Export PDF du rapport budget vs réel (" + annee + ")");
        return pdfService.reponsePdf(pdfService.nomFichierAscii("Rapport-analytique", String.valueOf(annee), "pdf"), pdf);
    }

    private String compteur(double ratio) {
        BigDecimal pourcentage = BigDecimal.valueOf(ratio * 100).setScale(1, RoundingMode.HALF_UP);
        return pourcentage.toPlainString().replace('.', ',') + " %";
    }
}
