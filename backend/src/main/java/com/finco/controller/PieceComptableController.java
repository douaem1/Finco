package com.finco.controller;

import com.finco.audit.ActionAudit;
import com.finco.audit.AuditService;
import com.finco.dto.PieceComptableRequest;
import com.finco.dto.PieceComptableResponse;
import com.finco.pdf.ContextePdf;
import com.finco.pdf.PdfService;
import com.finco.service.PieceComptableService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * API des écritures comptables.
 *  GET  /api/pieces               journal des pièces
 *  GET  /api/pieces/{id}          détail d'une pièce
 *  GET  /api/pieces/{id}/export/pdf  export PDF d'une pièce
 *  POST /api/pieces               saisie (rôle COMPTABLE ou ADMIN, cf. SecurityConfig)
 */
@RestController
@RequestMapping("/api/pieces")
public class PieceComptableController {

    private final PieceComptableService pieceComptableService;
    private final PdfService pdfService;
    private final ContextePdf contextePdf;
    private final AuditService auditService;

    public PieceComptableController(PieceComptableService pieceComptableService, PdfService pdfService,
                                    ContextePdf contextePdf, AuditService auditService) {
        this.pieceComptableService = pieceComptableService;
        this.pdfService = pdfService;
        this.contextePdf = contextePdf;
        this.auditService = auditService;
    }

    @GetMapping
    public List<PieceComptableResponse> lister() {
        return pieceComptableService.findAll();
    }

    @GetMapping("/{id}")
    public PieceComptableResponse detail(@PathVariable Long id) {
        return pieceComptableService.findById(id);
    }

    /** L'email du saisisseur vient du jeton (jamais du corps de la requête). */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PieceComptableResponse saisir(@RequestBody PieceComptableRequest requete, Authentication authentification) {
        return pieceComptableService.create(requete, authentification.getName());
    }

    /** Validation d'une pièce en brouillon (la pièce entre alors dans la balance). */
    @PatchMapping("/{id}/valider")
    public PieceComptableResponse valider(@PathVariable Long id) {
        return pieceComptableService.valider(id);
    }

    /** Export PDF d'une pièce comptable (filigrane BROUILLON si non validée). */
    @GetMapping("/{id}/export/pdf")
    public ResponseEntity<byte[]> exportPdf(@PathVariable Long id) {
        PieceComptableResponse piece = pieceComptableService.findById(id);

        Map<String, Object> modele = new HashMap<>();
        modele.put("societe", contextePdf.societe());
        modele.put("reference", piece.numero());
        modele.put("periode", "Exercice " + piece.exercice());
        modele.put("genereLe", contextePdf.maintenant());
        modele.put("par", contextePdf.nomUtilisateur() + " (" + contextePdf.roleUtilisateur() + ")");
        modele.put("exercice", String.valueOf(piece.exercice()));
        modele.put("filtres", "Pièce " + piece.numero());
        modele.put("empreinte", pdfService.empreinte(piece));
        modele.put("numero", piece.numero());
        modele.put("dateEcriture", piece.dateEcriture());
        modele.put("libelle", piece.libelle());
        modele.put("validee", piece.validee());
        modele.put("brouillon", !piece.validee());
        modele.put("statutLibelle", piece.validee() ? "Validée" : "Brouillon");
        modele.put("saisiePar", piece.saisiePar());
        modele.put("lignes", piece.lignes());
        modele.put("totalDebit", piece.totalDebit());
        modele.put("totalCredit", piece.totalCredit());
        modele.put("equilibre", piece.totalDebit() != null && piece.totalCredit() != null
                && piece.totalDebit().compareTo(piece.totalCredit()) == 0);
        modele.put("verifiePar", null);

        byte[] pdf = pdfService.rendrePdf("piece", modele);
        auditService.enregistrerExport(ActionAudit.EXPORT_PDF, "PIECE", piece.numero(),
                "Export PDF de la pièce " + piece.numero());
        return pdfService.reponsePdf(pdfService.nomFichierAscii("Piece", piece.numero(), "pdf"), pdf);
    }
}
