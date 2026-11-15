package com.finco.pdf;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests de fumée : chaque gabarit PDF doit se rendre sans exception, produire
 * un vrai fichier PDF (&gt; 3 Ko) et afficher les accents français et les
 * montants formatés « 1 234,56 ».
 */
class PdfServiceTest {

    private PdfService pdfService;

    @BeforeEach
    void setup() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode("HTML");
        resolver.setCharacterEncoding("UTF-8");
        resolver.setCacheable(false);

        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.setTemplateResolver(resolver);
        pdfService = new PdfService(engine);
    }

    private Map<String, Object> communs(String reference) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("societe", "FinCo SARL");
        m.put("reference", reference);
        m.put("empreinte", "ABCDEF123456");
        m.put("periode", "Du 01/01/2026 au 31/12/2026");
        m.put("genereLe", "15/11/2026 10:30");
        m.put("par", "Sara Bennani (Comptable)");
        m.put("exercice", "2026");
        m.put("filtres", "Aucun filtre");
        m.put("etabliPar", "Sara Bennani");
        m.put("etabliRole", "Comptable");
        m.put("verifiePar", "Youssef Tazi");
        m.put("verifieRole", "Contrôleur de gestion");
        return m;
    }

    private void verifierPdf(String gabarit, Map<String, Object> modele, String extraitAttendu) {
        String html = pdfService.rendreHtml(gabarit, modele);
        assertTrue(html.contains("é"), "Accents français attendus dans " + gabarit);
        assertTrue(html.contains(extraitAttendu),
                "Montant « " + extraitAttendu + " » attendu dans " + gabarit);

        byte[] pdf = pdfService.rendrePdf(gabarit, modele);
        assertNotNull(pdf);
        assertTrue(pdf.length > 3000, "PDF " + gabarit + " trop court : " + pdf.length + " octets");
        assertEquals('%', (char) pdf[0], "Le PDF " + gabarit + " doit commencer par %PDF");
        assertEquals('P', (char) pdf[1]);
        assertEquals('D', (char) pdf[2]);
        assertEquals('F', (char) pdf[3]);
    }

    private Map<String, Object> ligne(Object... paires) {
        Map<String, Object> m = new LinkedHashMap<>();
        for (int i = 0; i < paires.length; i += 2) {
            m.put((String) paires[i], paires[i + 1]);
        }
        return m;
    }

    @Test
    void grandLivre_seRenderEnPaysage() {
        Map<String, Object> compte = ligne(
                "numero", "6131",
                "libelle", "Locations et charges locatives",
                "soldeOuverture", new BigDecimal("0.00"),
                "totalDebit", new BigDecimal("10000.00"),
                "totalCredit", new BigDecimal("0.00"),
                "soldeFinal", new BigDecimal("10000.00"),
                "lignes", List.of(ligne(
                        "date", LocalDate.of(2026, 11, 5),
                        "pieceNumero", "PC-2026-00001",
                        "libelle", "Loyer de novembre",
                        "centreCode", "ADM",
                        "debit", new BigDecimal("10000.00"),
                        "credit", BigDecimal.ZERO,
                        "soldeCumule", new BigDecimal("10000.00"))));

        Map<String, Object> modele = communs("GL-2026");
        modele.put("comptes", List.of(compte));
        modele.put("totalDebit", new BigDecimal("10000.00"));
        modele.put("totalCredit", new BigDecimal("10000.00"));

        verifierPdf("grand-livre", modele, "10\u00A0000,00");
    }

    @Test
    void balance_seRenderAvecMarqueurEquilibre() {
        Map<String, Object> modele = communs("BAL-2026");
        modele.put("comptes", List.of(
                ligne("numero", "6131", "libelle", "Locations", "totalDebit", new BigDecimal("10000.00"),
                        "totalCredit", BigDecimal.ZERO, "soldeDebiteur", new BigDecimal("10000.00"),
                        "soldeCrediteur", BigDecimal.ZERO)));
        modele.put("totalDebit", new BigDecimal("10000.00"));
        modele.put("totalCredit", new BigDecimal("10000.00"));
        modele.put("equilibree", true);

        verifierPdf("balance", modele, "10\u00A0000,00");
    }

    @Test
    void piece_seRenderAvecStatutEtEquilibre() {
        Map<String, Object> modele = communs("PC-2026-00001");
        modele.put("brouillon", false);
        modele.put("numero", "PC-2026-00001");
        modele.put("dateEcriture", LocalDate.of(2026, 11, 5));
        modele.put("libelle", "Facture de loyer");
        modele.put("validee", true);
        modele.put("statutLibelle", "Validée");
        modele.put("saisiePar", "Sara Bennani");
        modele.put("lignes", List.of(
                ligne("compteNumero", "6131", "compteLibelle", "Locations", "centreCoutCode", "ADM",
                        "sens", "DEBIT", "montant", new BigDecimal("10000.00")),
                ligne("compteNumero", "5141", "compteLibelle", "Banques", "centreCoutCode", null,
                        "sens", "CREDIT", "montant", new BigDecimal("10000.00"))));
        modele.put("totalDebit", new BigDecimal("10000.00"));
        modele.put("totalCredit", new BigDecimal("10000.00"));
        modele.put("equilibre", true);

        verifierPdf("piece", modele, "10\u00A0000,00");
    }

    @Test
    void pieceBrouillon_afficheLeFiligrane() {
        Map<String, Object> modele = communs("PC-2026-00002");
        modele.put("brouillon", true);
        modele.put("numero", "PC-2026-00002");
        modele.put("dateEcriture", LocalDate.of(2026, 11, 6));
        modele.put("libelle", "Brouillon de démonstration");
        modele.put("validee", false);
        modele.put("statutLibelle", "Brouillon");
        modele.put("saisiePar", "Sara Bennani");
        modele.put("lignes", List.of());
        modele.put("totalDebit", new BigDecimal("0.00"));
        modele.put("totalCredit", new BigDecimal("0.00"));
        modele.put("equilibre", true);

        String html = pdfService.rendreHtml("piece", modele);
        assertTrue(html.contains("BROUILLON"), "Le filigrane BROUILLON doit apparaître.");
        verifierPdf("piece", modele, "0,00");
    }

    @Test
    void facture_seRenderAvecTiersEtPaiements() {
        Map<String, Object> modele = communs("FAC-2026-001");
        modele.put("brouillon", false);
        modele.put("tiersNom", "Fournisseur Alpha SARL");
        modele.put("numero", "FAC-2026-001");
        modele.put("dateFacture", LocalDate.of(2026, 11, 2));
        modele.put("type", "ACHAT");
        modele.put("statut", "PAYEE");
        modele.put("statutLibelle", "Payée");
        modele.put("pieceNumero", "PC-2026-00001");
        modele.put("montantHT", new BigDecimal("10000.00"));
        modele.put("tauxTVA", new BigDecimal("20.00"));
        modele.put("montantTVA", new BigDecimal("2000.00"));
        modele.put("montantTTC", new BigDecimal("12000.00"));
        modele.put("totalAffecte", new BigDecimal("12000.00"));
        modele.put("resteAPayer", new BigDecimal("0.00"));
        modele.put("paiements", List.of(ligne(
                "date", LocalDate.of(2026, 11, 10),
                "montant", new BigDecimal("12000.00"),
                "statut", "Validé",
                "validePar", "Nadia El Idrissi")));
        modele.put("validePar", "Nadia El Idrissi");
        modele.put("dateValidation", "10/11/2026");

        verifierPdf("facture", modele, "12\u00A0000,00");
    }

    @Test
    void rapportAnalytique_seRenderAvecConsommation() {
        Map<String, Object> modele = communs("RAP-2026");
        modele.put("totalCharges", new BigDecimal("14000.00"));
        modele.put("totalProduits", new BigDecimal("20000.00"));
        modele.put("centres", List.of(ligne(
                "code", "ADM",
                "libelle", "Administration",
                "budget", new BigDecimal("12000.00"),
                "reel", new BigDecimal("14000.00"),
                "ecart", new BigDecimal("2000.00"),
                "statutClasse", "depassement",
                "barrePourcent", 100,
                "consommation", "116,67 %",
                "statut", "Dépassement")));
        modele.put("totalBudget", new BigDecimal("12000.00"));
        modele.put("totalReel", new BigDecimal("14000.00"));
        modele.put("approuvePar", null);

        verifierPdf("rapport-analytique", modele, "14\u00A0000,00");
    }

    @Test
    void paiements_seRenderAvecStatuts() {
        Map<String, Object> modele = communs("PAIEMENTS");
        modele.put("lignes", List.of(ligne(
                "id", 1L,
                "datePaiement", "15/11/2026",
                "montant", new BigDecimal("12000.00"),
                "mode", "VIREMENT",
                "statut", "Validé",
                "statutClasse", "badge-succes",
                "validePar", "Nadia El Idrissi",
                "observation", "—")));
        modele.put("total", new BigDecimal("12000.00"));

        verifierPdf("paiements", modele, "12\u00A0000,00");
    }

    @Test
    void journalAudit_seRenderAvecResultats() {
        Map<String, Object> modele = communs("JOURNAL-AUDIT");
        modele.put("lignes", List.of(ligne(
                "dateHeure", "15/11/2026 10:30:00",
                "utilisateur", "Sara Bennani",
                "role", "Comptable",
                "action", "Pièce validée",
                "categorie", "Comptabilité",
                "entite", "PIECE",
                "reference", "PC-2026-00001",
                "details", "Validation de la pièce",
                "resultat", "Succès",
                "echec", false,
                "adresseIp", "127.0.0.1")));
        modele.put("total", 1L);
        modele.put("tronque", false);

        verifierPdf("journal-audit", modele, "127.0.0.1");
    }

    @Test
    void polices_nonPresentes_repliStandard() {
        assertFalse(pdfService.policesEmbarquees(),
                "Les TTF de marque sont absents : le repli Times/Helvetica doit être utilisé.");
    }
}
