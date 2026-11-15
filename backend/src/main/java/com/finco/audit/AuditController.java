package com.finco.audit;

import com.finco.pdf.ContextePdf;
import com.finco.pdf.CsvBuilder;
import com.finco.pdf.PdfService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * API du journal d'audit — réservée au rôle ADMIN (jamais exposée aux autres
 * rôles, jamais de fuite d'entité : uniquement des DTO).
 */
@RestController
@RequestMapping("/api/admin/audit")
public class AuditController {

    private static final int TAILLE_MAX = 100;
    private static final int LIGNES_EXPORT_MAX = 5000;
    private static final DateTimeFormatter HORODATAGE = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
    private static final DateTimeFormatter JOUR = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final AuditService auditService;
    private final PdfService pdfService;
    private final ContextePdf contextePdf;

    public AuditController(AuditService auditService, PdfService pdfService, ContextePdf contextePdf) {
        this.auditService = auditService;
        this.pdfService = pdfService;
        this.contextePdf = contextePdf;
    }

    @GetMapping
    public AuditPageResponse lister(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) Long utilisateurId,
            @RequestParam(required = false) ActionAudit action,
            @RequestParam(required = false) CategorieAudit categorie,
            @RequestParam(required = false) String entiteType,
            @RequestParam(required = false) ResultatAudit resultat,
            @RequestParam(required = false, name = "q") String texte) {

        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), TAILLE_MAX),
                Sort.by(Sort.Direction.DESC, "dateEvenement"));
        return auditService.rechercher(filtres(dateFrom, dateTo, utilisateurId, action, categorie, entiteType, resultat, texte), pageable);
    }

    @GetMapping("/statistiques")
    public AuditStatistiquesResponse statistiques(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        LocalDateTime from = dateFrom != null ? dateFrom.atStartOfDay() : null;
        LocalDateTime to = dateTo != null ? dateTo.atTime(23, 59, 59) : null;
        return auditService.statistiques(from, to);
    }

    @GetMapping("/entite/{type}/{id}")
    public List<AuditEventResponse> historiqueEntite(@PathVariable String type, @PathVariable Long id) {
        return auditService.historiqueEntite(type, id);
    }

    @GetMapping("/{id}")
    public AuditEventResponse obtenir(@PathVariable Long id) {
        return auditService.obtenir(id);
    }

    // ------------------------------------------------------------------
    // Exports (réservés ADMIN)
    // ------------------------------------------------------------------

    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportPdf(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) Long utilisateurId,
            @RequestParam(required = false) ActionAudit action,
            @RequestParam(required = false) CategorieAudit categorie,
            @RequestParam(required = false) String entiteType,
            @RequestParam(required = false) ResultatAudit resultat,
            @RequestParam(required = false, name = "q") String texte) {

        AuditFiltres filtres = filtres(dateFrom, dateTo, utilisateurId, action, categorie, entiteType, resultat, texte);
        AuditExportResponse export = auditService.exporter(filtres, LIGNES_EXPORT_MAX);

        List<Map<String, Object>> lignes = new ArrayList<>();
        for (AuditEventResponse e : export.content()) {
            Map<String, Object> ligne = new HashMap<>();
            ligne.put("dateHeure", e.dateEvenement() != null ? e.dateEvenement().format(HORODATAGE) : "");
            ligne.put("utilisateur", e.utilisateurNom() != null ? e.utilisateurNom() : "—");
            ligne.put("role", e.utilisateurRole() != null ? ContextePdf.libelleRole(safeRole(e.utilisateurRole())) : "");
            ligne.put("action", e.actionLibelle() != null ? e.actionLibelle() : e.action());
            ligne.put("categorie", e.categorieLibelle() != null ? e.categorieLibelle() : "");
            ligne.put("entite", e.entiteType() != null ? e.entiteType() : "");
            ligne.put("reference", e.entiteReference());
            ligne.put("details", e.details() != null ? e.details() : "");
            ligne.put("resultat", e.resultatLibelle() != null ? e.resultatLibelle() : e.resultat());
            ligne.put("echec", "ECHEC".equals(e.resultat()));
            ligne.put("adresseIp", e.adresseIp() != null ? e.adresseIp() : "");
            lignes.add(ligne);
        }

        Map<String, Object> modele = new HashMap<>();
        modele.put("societe", contextePdf.societe());
        modele.put("reference", "JOURNAL-AUDIT");
        modele.put("periode", periode(dateFrom, dateTo));
        modele.put("genereLe", contextePdf.maintenant());
        modele.put("par", contextePdf.nomUtilisateur() + " (" + contextePdf.roleUtilisateur() + ")");
        modele.put("exercice", String.valueOf(LocalDate.now().getYear()));
        modele.put("filtres", descriptionFiltres(filtres));
        modele.put("empreinte", pdfService.empreinte(export.content()));
        modele.put("lignes", lignes);
        modele.put("total", export.totalElements());
        modele.put("tronque", export.tronque());

        byte[] pdf = pdfService.rendrePdf("journal-audit", modele);
        auditService.enregistrerExport(ActionAudit.EXPORT_PDF, "JOURNAL_AUDIT", "Journal d'audit",
                "Export PDF du journal d'audit (" + export.content().size() + " événement(s))");
        return pdfService.reponsePdf(pdfService.nomFichierAscii("Journal-audit", "global", "pdf"), pdf);
    }

    @GetMapping("/export/csv")
    public ResponseEntity<byte[]> exportCsv(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) Long utilisateurId,
            @RequestParam(required = false) ActionAudit action,
            @RequestParam(required = false) CategorieAudit categorie,
            @RequestParam(required = false) String entiteType,
            @RequestParam(required = false) ResultatAudit resultat,
            @RequestParam(required = false, name = "q") String texte) {

        AuditFiltres filtres = filtres(dateFrom, dateTo, utilisateurId, action, categorie, entiteType, resultat, texte);
        AuditExportResponse export = auditService.exporter(filtres, LIGNES_EXPORT_MAX);

        CsvBuilder csv = new CsvBuilder()
                .entete("Date et heure", "Utilisateur", "Rôle", "Action", "Catégorie",
                        "Entité", "Référence", "Résultat", "Adresse IP", "Request ID", "Détails");
        for (AuditEventResponse e : export.content()) {
            csv.ligne(
                    e.dateEvenement() != null ? e.dateEvenement().format(HORODATAGE) : "",
                    e.utilisateurNom(),
                    e.utilisateurRole(),
                    e.actionLibelle() != null ? e.actionLibelle() : e.action(),
                    e.categorieLibelle(),
                    e.entiteType(),
                    e.entiteReference(),
                    e.resultatLibelle(),
                    e.adresseIp(),
                    e.requestId(),
                    e.details());
        }
        if (export.tronque()) {
            csv.ligne("Export tronqué : seuls les 5000 événements les plus récents sont affichés.");
        }

        auditService.enregistrerExport(ActionAudit.EXPORT_CSV, "JOURNAL_AUDIT", "Journal d'audit",
                "Export CSV du journal d'audit (" + export.content().size() + " événement(s))");
        return pdfService.reponseCsv(pdfService.nomFichierAscii("Journal-audit", "global", "csv"), csv.build());
    }

    // ------------------------------------------------------------------

    private AuditFiltres filtres(LocalDate dateFrom, LocalDate dateTo, Long utilisateurId, ActionAudit action,
                                 CategorieAudit categorie, String entiteType, ResultatAudit resultat, String texte) {
        return new AuditFiltres(
                dateFrom != null ? dateFrom.atStartOfDay() : null,
                dateTo != null ? dateTo.atTime(23, 59, 59) : null,
                utilisateurId, action, categorie, entiteType, resultat, texte);
    }

    private String periode(LocalDate dateFrom, LocalDate dateTo) {
        if (dateFrom == null && dateTo == null) {
            return "Toutes périodes";
        }
        String debut = dateFrom != null ? dateFrom.format(JOUR) : "origine";
        String fin = dateTo != null ? dateTo.format(JOUR) : "aujourd'hui";
        return "Du " + debut + " au " + fin;
    }

    private String descriptionFiltres(AuditFiltres filtres) {
        List<String> parties = new ArrayList<>();
        if (filtres.dateFrom() != null || filtres.dateTo() != null) {
            parties.add(periode(filtres.dateFrom() != null ? filtres.dateFrom().toLocalDate() : null,
                    filtres.dateTo() != null ? filtres.dateTo().toLocalDate() : null));
        }
        if (filtres.categorie() != null) {
            parties.add("Catégorie : " + filtres.categorie().libelle());
        }
        if (filtres.action() != null) {
            parties.add("Action : " + filtres.action().libelle());
        }
        if (filtres.resultat() != null) {
            parties.add("Résultat : " + filtres.resultat().libelle());
        }
        if (filtres.entiteType() != null && !filtres.entiteType().isBlank()) {
            parties.add("Entité : " + filtres.entiteType());
        }
        if (filtres.texte() != null && !filtres.texte().isBlank()) {
            parties.add("Recherche : « " + filtres.texte() + " »");
        }
        return parties.isEmpty() ? "Aucun filtre" : String.join(" · ", parties);
    }

    private com.finco.entity.enums.Role safeRole(String role) {
        try {
            return com.finco.entity.enums.Role.valueOf(role);
        } catch (Exception e) {
            return null;
        }
    }
}
