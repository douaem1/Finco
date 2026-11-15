package com.finco.controller;

import com.finco.audit.ActionAudit;
import com.finco.audit.AuditService;
import com.finco.dto.BalanceResponse;
import com.finco.dto.CompteBalance;
import com.finco.dto.CompteGrandLivre;
import com.finco.dto.GrandLivreResponse;
import com.finco.pdf.ContextePdf;
import com.finco.pdf.CsvBuilder;
import com.finco.pdf.PdfService;
import com.finco.service.GrandLivreService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Exports du grand livre et de la balance des comptes (PDF et CSV).
 *
 * Les données proviennent de {@link GrandLivreService}, qui agrège les mêmes
 * lignes de pièces validées que l'interface : aucune règle comptable nouvelle.
 * Rôles autorisés : ceux qui peuvent déjà consulter la comptabilité
 * (COMPTABLE, DIRECTEUR_FINANCIER) — cf. SecurityConfig.
 */
@RestController
@RequestMapping("/api")
public class EtatComptableController {

    private static final DateTimeFormatter JOUR = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final GrandLivreService grandLivreService;
    private final PdfService pdfService;
    private final ContextePdf contextePdf;
    private final AuditService auditService;

    public EtatComptableController(GrandLivreService grandLivreService, PdfService pdfService,
                                   ContextePdf contextePdf, AuditService auditService) {
        this.grandLivreService = grandLivreService;
        this.pdfService = pdfService;
        this.contextePdf = contextePdf;
        this.auditService = auditService;
    }

    // ------------------------------------------------------------------
    // Grand livre
    // ------------------------------------------------------------------

    @GetMapping("/grand-livre/export/pdf")
    public ResponseEntity<byte[]> grandLivrePdf(
            @RequestParam(required = false) String compteNumero,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {

        GrandLivreResponse grandLivre = grandLivreService.grandLivre(compteNumero, dateFrom, dateTo);

        Map<String, Object> modele = new HashMap<>();
        modele.put("societe", contextePdf.societe());
        modele.put("reference", referenceGrandLivre(compteNumero));
        modele.put("periode", periode(dateFrom, dateTo));
        modele.put("genereLe", contextePdf.maintenant());
        modele.put("par", contextePdf.nomUtilisateur() + " (" + contextePdf.roleUtilisateur() + ")");
        modele.put("exercice", String.valueOf(LocalDate.now().getYear()));
        modele.put("filtres", descriptionFiltres(compteNumero, dateFrom, dateTo));
        modele.put("empreinte", pdfService.empreinte(grandLivre));
        modele.put("comptes", grandLivre.comptes());
        modele.put("totalDebit", grandLivre.totalDebit());
        modele.put("totalCredit", grandLivre.totalCredit());
        modele.put("etabliPar", contextePdf.nomUtilisateur());
        modele.put("etabliRole", contextePdf.roleUtilisateur());
        modele.put("verifiePar", null);
        modele.put("verifieRole", "Contrôleur de gestion");

        byte[] pdf = pdfService.rendrePdf("grand-livre", modele);
        auditService.enregistrerExport(ActionAudit.EXPORT_PDF, "GRAND_LIVRE", referenceGrandLivre(compteNumero),
                "Export PDF du grand livre (" + grandLivre.comptes().size() + " compte(s))");
        return pdfService.reponsePdf(pdfService.nomFichierAscii("Grand-livre",
                compteNumero != null && !compteNumero.isBlank() ? compteNumero : "global", "pdf"), pdf);
    }

    @GetMapping("/grand-livre/export/csv")
    public ResponseEntity<byte[]> grandLivreCsv(
            @RequestParam(required = false) String compteNumero,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {

        GrandLivreResponse grandLivre = grandLivreService.grandLivre(compteNumero, dateFrom, dateTo);
        CsvBuilder csv = new CsvBuilder()
                .entete("Compte", "Libellé du compte", "Date", "Pièce", "Libellé", "Centre de coûts",
                        "Débit", "Crédit", "Solde cumulé");
        for (CompteGrandLivre compte : grandLivre.comptes()) {
            csv.ligne(compte.numero(), compte.libelle(), "", "SOLDE D'OUVERTURE", "", "",
                    "", "", compte.soldeOuverture());
            for (CompteGrandLivre.LigneGrandLivre ligne : compte.lignes()) {
                csv.ligne(compte.numero(), compte.libelle(),
                        ligne.date() != null ? ligne.date().format(JOUR) : "",
                        ligne.pieceNumero(), ligne.libelle(),
                        ligne.centreCode() == null ? "" : ligne.centreCode(),
                        ligne.debit(), ligne.credit(), ligne.soldeCumule());
            }
            csv.ligne(compte.numero(), compte.libelle(), "", "TOTAL COMPTE", "", "",
                    compte.totalDebit(), compte.totalCredit(), compte.soldeFinal());
        }
        csv.ligne("", "TOTAL GÉNÉRAL", "", "", "", "",
                grandLivre.totalDebit(), grandLivre.totalCredit(), "");

        auditService.enregistrerExport(ActionAudit.EXPORT_CSV, "GRAND_LIVRE", referenceGrandLivre(compteNumero),
                "Export CSV du grand livre (" + grandLivre.comptes().size() + " compte(s))");
        return pdfService.reponseCsv(pdfService.nomFichierAscii("Grand-livre",
                compteNumero != null && !compteNumero.isBlank() ? compteNumero : "global", "csv"), csv.build());
    }

    // ------------------------------------------------------------------
    // Balance des comptes
    // ------------------------------------------------------------------

    @GetMapping("/balance/export/pdf")
    public ResponseEntity<byte[]> balancePdf(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {

        BalanceResponse balance = grandLivreService.balance(dateFrom, dateTo);

        Map<String, Object> modele = new HashMap<>();
        modele.put("societe", contextePdf.societe());
        modele.put("reference", "BALANCE-" + LocalDate.now().getYear());
        modele.put("periode", periode(dateFrom, dateTo));
        modele.put("genereLe", contextePdf.maintenant());
        modele.put("par", contextePdf.nomUtilisateur() + " (" + contextePdf.roleUtilisateur() + ")");
        modele.put("exercice", String.valueOf(LocalDate.now().getYear()));
        modele.put("filtres", descriptionFiltres(null, dateFrom, dateTo));
        modele.put("empreinte", pdfService.empreinte(balance));
        modele.put("comptes", balance.comptes());
        modele.put("totalDebit", balance.totalDebit());
        modele.put("totalCredit", balance.totalCredit());
        modele.put("equilibree", balance.equilibree());
        modele.put("etabliPar", contextePdf.nomUtilisateur());
        modele.put("etabliRole", contextePdf.roleUtilisateur());
        modele.put("verifiePar", null);
        modele.put("verifieRole", "Contrôleur de gestion");

        byte[] pdf = pdfService.rendrePdf("balance", modele);
        auditService.enregistrerExport(ActionAudit.EXPORT_PDF, "BALANCE", "Balance des comptes",
                "Export PDF de la balance (" + balance.comptes().size() + " compte(s))");
        return pdfService.reponsePdf(pdfService.nomFichierAscii("Balance", "global", "pdf"), pdf);
    }

    @GetMapping("/balance/export/csv")
    public ResponseEntity<byte[]> balanceCsv(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {

        BalanceResponse balance = grandLivreService.balance(dateFrom, dateTo);
        CsvBuilder csv = new CsvBuilder()
                .entete("Compte", "Libellé", "Total débit", "Total crédit", "Solde débiteur", "Solde créditeur");
        for (CompteBalance compte : balance.comptes()) {
            csv.ligne(compte.numero(), compte.libelle(), compte.totalDebit(), compte.totalCredit(),
                    compte.soldeDebiteur(), compte.soldeCrediteur());
        }
        csv.ligne("", "TOTAUX GÉNÉRAUX", balance.totalDebit(), balance.totalCredit(), "", "");
        csv.ligne("", balance.equilibree() ? "Balance équilibrée" : "Balance NON équilibrée");

        auditService.enregistrerExport(ActionAudit.EXPORT_CSV, "BALANCE", "Balance des comptes",
                "Export CSV de la balance (" + balance.comptes().size() + " compte(s))");
        return pdfService.reponseCsv(pdfService.nomFichierAscii("Balance", "global", "csv"), csv.build());
    }

    // ------------------------------------------------------------------

    private String referenceGrandLivre(String compteNumero) {
        return compteNumero != null && !compteNumero.isBlank()
                ? "Compte " + compteNumero
                : "GRAND-LIVRE-" + LocalDate.now().getYear();
    }

    private String periode(LocalDate dateFrom, LocalDate dateTo) {
        if (dateFrom == null && dateTo == null) {
            return "Toutes périodes";
        }
        String debut = dateFrom != null ? dateFrom.format(JOUR) : "origine";
        String fin = dateTo != null ? dateTo.format(JOUR) : "aujourd'hui";
        return "Du " + debut + " au " + fin;
    }

    private String descriptionFiltres(String compteNumero, LocalDate dateFrom, LocalDate dateTo) {
        List<String> parties = new ArrayList<>();
        if (compteNumero != null && !compteNumero.isBlank()) {
            parties.add("Compte : " + compteNumero);
        }
        if (dateFrom != null || dateTo != null) {
            parties.add(periode(dateFrom, dateTo));
        }
        return parties.isEmpty() ? "Aucun filtre" : String.join(" · ", parties);
    }
}
