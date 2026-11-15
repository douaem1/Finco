package com.finco.controller;

import com.finco.audit.ActionAudit;
import com.finco.audit.AuditService;
import com.finco.dto.PaiementDirectionResponse;
import com.finco.dto.PaiementRequest;
import com.finco.pdf.ContextePdf;
import com.finco.pdf.PdfService;
import com.finco.service.PaiementDirectionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/paiements")
public class PaiementController {

    private static final DateTimeFormatter JOUR = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final PaiementDirectionService service;
    private final PdfService pdfService;
    private final ContextePdf contextePdf;
    private final AuditService auditService;

    public PaiementController(PaiementDirectionService service, PdfService pdfService,
                              ContextePdf contextePdf, AuditService auditService) {
        this.service = service;
        this.pdfService = pdfService;
        this.contextePdf = contextePdf;
        this.auditService = auditService;
    }

    @GetMapping
    public List<PaiementDirectionResponse> lister() {
        return service.lister();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PaiementDirectionResponse creer(@RequestBody PaiementRequest request) {
        return service.creer(request);
    }

    /** Export PDF de la liste des paiements avec leur statut. */
    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportPdf() {
        List<PaiementDirectionResponse> paiements = service.lister();

        List<Map<String, Object>> lignes = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        for (PaiementDirectionResponse p : paiements) {
            Map<String, Object> ligne = new HashMap<>();
            ligne.put("id", p.id());
            ligne.put("datePaiement", p.datePaiement() != null ? p.datePaiement().format(JOUR) : "");
            ligne.put("montant", p.montant());
            ligne.put("mode", p.mode());
            boolean valide = p.valide();
            boolean rejete = p.rejete();
            ligne.put("statut", valide ? "Validé" : (rejete ? "Rejeté" : "En attente"));
            ligne.put("statutClasse", valide ? "badge-succes" : (rejete ? "badge-echec" : "badge-attention"));
            ligne.put("validePar", p.validePar());
            ligne.put("observation", valide ? "Paiement validé"
                    : (rejete ? "Rejeté : " + (p.motifRejet() != null ? p.motifRejet() : "")
                    : "En attente de validation"));
            lignes.add(ligne);
            if (p.montant() != null) {
                total = total.add(p.montant());
            }
        }

        Map<String, Object> modele = new HashMap<>();
        modele.put("societe", contextePdf.societe());
        modele.put("reference", "PAIEMENTS-" + LocalDate.now().getYear());
        modele.put("periode", "Toutes périodes");
        modele.put("genereLe", contextePdf.maintenant());
        modele.put("par", contextePdf.nomUtilisateur() + " (" + contextePdf.roleUtilisateur() + ")");
        modele.put("exercice", String.valueOf(LocalDate.now().getYear()));
        modele.put("filtres", "Aucun filtre");
        modele.put("empreinte", pdfService.empreinte(paiements));
        modele.put("lignes", lignes);
        modele.put("total", total);
        modele.put("etabliPar", contextePdf.nomUtilisateur());
        modele.put("etabliRole", contextePdf.roleUtilisateur());
        modele.put("verifiePar", null);
        modele.put("verifieRole", "Contrôleur de gestion");

        byte[] pdf = pdfService.rendrePdf("paiements", modele);
        auditService.enregistrerExport(ActionAudit.EXPORT_PDF, "PAIEMENT", "Liste des paiements",
                "Export PDF de la liste des paiements (" + paiements.size() + " ligne(s))");
        return pdfService.reponsePdf(pdfService.nomFichierAscii("Paiements", "global", "pdf"), pdf);
    }
}
