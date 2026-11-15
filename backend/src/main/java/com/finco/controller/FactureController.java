package com.finco.controller;

import com.finco.audit.ActionAudit;
import com.finco.audit.AuditService;
import com.finco.dto.FactureRequest;
import com.finco.dto.FactureResponse;
import com.finco.dto.FactureValidationRequest;
import com.finco.entity.AllocationPaiement;
import com.finco.pdf.ContextePdf;
import com.finco.pdf.PdfService;
import com.finco.repository.AllocationPaiementRepository;
import com.finco.service.FactureService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/factures")
public class FactureController {

    private final FactureService service;
    private final AllocationPaiementRepository allocationRepository;
    private final PdfService pdfService;
    private final ContextePdf contextePdf;
    private final AuditService auditService;

    public FactureController(FactureService service, AllocationPaiementRepository allocationRepository,
                             PdfService pdfService, ContextePdf contextePdf, AuditService auditService) {
        this.service = service;
        this.allocationRepository = allocationRepository;
        this.pdfService = pdfService;
        this.contextePdf = contextePdf;
        this.auditService = auditService;
    }

    @GetMapping
    public List<FactureResponse> lister() {
        return service.lister();
    }

    @GetMapping("/{id}")
    public FactureResponse obtenir(@PathVariable Long id) {
        return service.obtenir(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FactureResponse creer(@RequestBody FactureRequest request) {
        return service.creer(request);
    }

    @PutMapping("/{id}")
    public FactureResponse modifier(@PathVariable Long id, @RequestBody FactureRequest request) {
        return service.modifier(id, request);
    }

    @PatchMapping("/{id}/valider")
    public FactureResponse valider(@PathVariable Long id, @RequestBody(required = false) FactureValidationRequest request,
                                   Authentication authentication) {
        return service.valider(id, request, authentication.getName());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void supprimer(@PathVariable Long id) {
        service.supprimer(id);
    }

    /** Export PDF d'une facture (détail, règlements affectés, reste à payer). */
    @GetMapping("/{id}/export/pdf")
    public ResponseEntity<byte[]> exportPdf(@PathVariable Long id) {
        FactureResponse facture = service.obtenir(id);
        BigDecimal ttc = facture.montantTTC() != null ? facture.montantTTC() : BigDecimal.ZERO;
        BigDecimal ht = facture.montantHT() != null ? facture.montantHT() : BigDecimal.ZERO;
        BigDecimal tva = ttc.subtract(ht);
        BigDecimal totalAffecte = allocationRepository.totalAffecteValide(id);
        if (totalAffecte == null) {
            totalAffecte = BigDecimal.ZERO;
        }
        BigDecimal reste = ttc.subtract(totalAffecte).setScale(2, RoundingMode.HALF_UP);

        List<AllocationPaiement> allocations = allocationRepository.findAllByFactureIdWithPaiement(id);
        List<Map<String, Object>> paiements = allocations.stream().map(a -> {
            Map<String, Object> ligne = new HashMap<>();
            var paiement = a.getPaiement();
            ligne.put("date", paiement != null ? paiement.getDatePaiement() : null);
            ligne.put("montant", a.getMontantAffecte());
            ligne.put("statut", paiement == null ? "—"
                    : (paiement.getValidePar() != null ? "Validé"
                    : (paiement.getRejetePar() != null ? "Rejeté" : "En attente")));
            ligne.put("validePar", paiement != null && paiement.getValidePar() != null
                    ? paiement.getValidePar().getNomComplet() : null);
            return ligne;
        }).toList();

        Map<String, Object> modele = new HashMap<>();
        modele.put("societe", contextePdf.societe());
        modele.put("reference", facture.numero());
        modele.put("periode", "Facture du " + contextePdf.jour(facture.dateFacture()));
        modele.put("genereLe", contextePdf.maintenant());
        modele.put("par", contextePdf.nomUtilisateur() + " (" + contextePdf.roleUtilisateur() + ")");
        modele.put("exercice", String.valueOf(LocalDate.now().getYear()));
        modele.put("filtres", "Facture " + facture.numero());
        modele.put("empreinte", pdfService.empreinte(facture));
        modele.put("numero", facture.numero());
        modele.put("dateFacture", facture.dateFacture());
        modele.put("type", facture.type());
        modele.put("tiersNom", facture.tiersNom());
        modele.put("statut", facture.statut());
        modele.put("statutLibelle", libelleStatut(facture.statut()));
        modele.put("brouillon", "BROUILLON".equals(facture.statut()));
        modele.put("montantHT", ht);
        modele.put("tauxTVA", facture.tauxTVA());
        modele.put("montantTVA", tva);
        modele.put("montantTTC", ttc);
        modele.put("totalAffecte", totalAffecte);
        modele.put("resteAPayer", reste);
        modele.put("pieceNumero", facture.pieceNumero());
        modele.put("paiements", paiements);
        modele.put("etabliPar", contextePdf.nomUtilisateur());
        modele.put("etabliRole", contextePdf.roleUtilisateur());
        modele.put("verifiePar", null);
        modele.put("verifieRole", "Contrôleur de gestion");
        modele.put("validePar", null);
        modele.put("dateValidation", null);

        byte[] pdf = pdfService.rendrePdf("facture", modele);
        auditService.enregistrerExport(ActionAudit.EXPORT_PDF, "FACTURE", facture.numero(),
                "Export PDF de la facture " + facture.numero());
        return pdfService.reponsePdf(pdfService.nomFichierAscii("Facture", facture.numero(), "pdf"), pdf);
    }

    private String libelleStatut(String statut) {
        if (statut == null) {
            return "";
        }
        return switch (statut) {
            case "BROUILLON" -> "Brouillon";
            case "VALIDEE" -> "Validée";
            case "PAYEE" -> "Payée";
            default -> statut;
        };
    }
}
