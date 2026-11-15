package com.finco.pdf;

import com.openhtmltopdf.outputdevice.helper.BaseRendererBuilder.FontStyle;
import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * Rendu des documents PDF : un gabarit Thymeleaf (XHTML) est transformé en HTML
 * puis converti en PDF par OpenHTMLtoPDF.
 *
 * - A4 portrait par défaut, paysage pour les tableaux larges (grand livre) ;
 * - marges 18 mm, compteur « Page x / y » via les zones @page ;
 * - en-têtes de tableau répétés, lignes non coupées ;
 * - thème d'impression TOUJOURS clair (indépendant du thème de l'interface) ;
 * - polices Fraunces / Space Grotesk embarquées si présentes dans
 *   src/main/resources/fonts (TTF), sinon repli Times / Helvetica.
 */
@Service
public class PdfService {

    private static final Logger log = LoggerFactory.getLogger(PdfService.class);
    private static final DateTimeFormatter HORODATAGE_FICHIER = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");

    private final TemplateEngine templateEngine;
    private final Formats formats = new Formats();

    /** Vrai si les polices de marque ont pu être enregistrées (sinon repli standard). */
    private final boolean policesEmbarquees;

    public PdfService(TemplateEngine templateEngine) {
        this.templateEngine = templateEngine;
        this.policesEmbarquees = ressourcePresente("/fonts/Fraunces.ttf")
                && ressourcePresente("/fonts/SpaceGrotesk.ttf");
    }

    public boolean policesEmbarquees() {
        return policesEmbarquees;
    }

    /** Rend le gabarit Thymeleaf en une chaîne HTML. */
    public String rendreHtml(String gabarit, Map<String, Object> modele) {
        Context contexte = new Context();
        Map<String, Object> variables = new HashMap<>(modele);
        variables.putIfAbsent("fmt", formats);
        contexte.setVariables(variables);
        return templateEngine.process("pdf/" + gabarit, contexte);
    }

    /** Rend le gabarit puis le convertit en octets PDF. */
    public byte[] rendrePdf(String gabarit, Map<String, Object> modele) {
        String html = rendreHtml(gabarit, modele);
        try (ByteArrayOutputStream sortie = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            enregistrerPolices(builder);
            builder.withHtmlContent(html, "");
            builder.toStream(sortie);
            builder.run();
            return sortie.toByteArray();
        } catch (Exception e) {
            log.error("Échec de génération du PDF (gabarit={})", gabarit, e);
            throw new IllegalStateException("La génération du PDF a échoué.", e);
        }
    }

    /** Enregistre les polices de marque si elles sont présentes (sinon repli intégré). */
    private void enregistrerPolices(PdfRendererBuilder builder) {
        chargerPolice(builder, "/fonts/Fraunces.ttf", "FinCo Serif", 700, FontStyle.NORMAL);
        chargerPolice(builder, "/fonts/Fraunces.ttf", "FinCo Serif", 400, FontStyle.NORMAL);
        chargerPolice(builder, "/fonts/SpaceGrotesk.ttf", "FinCo Sans", 400, FontStyle.NORMAL);
        chargerPolice(builder, "/fonts/SpaceGrotesk.ttf", "FinCo Sans", 700, FontStyle.NORMAL);
    }

    private void chargerPolice(PdfRendererBuilder builder, String chemin, String famille, int poids, FontStyle style) {
        if (!ressourcePresente(chemin)) {
            return;
        }
        try {
            builder.useFont(() -> PdfService.class.getResourceAsStream(chemin), famille, poids, style, true);
        } catch (Exception e) {
            log.warn("Police {} non embarquée (repli standard utilisé) : {}", chemin, e.getMessage());
        }
    }

    private boolean ressourcePresente(String chemin) {
        try (InputStream flux = PdfService.class.getResourceAsStream(chemin)) {
            return flux != null;
        } catch (Exception e) {
            return false;
        }
    }

    /** Réponse HTTP d'un PDF : pièce jointe, nom ASCII sûr, pas de cache. */
    public ResponseEntity<byte[]> reponsePdf(String nomFichierAscii, byte[] contenu) {
        HttpHeaders entetes = new HttpHeaders();
        entetes.setContentType(MediaType.APPLICATION_PDF);
        entetes.setContentDisposition(ContentDisposition.attachment()
                .filename(nomFichierAscii, StandardCharsets.US_ASCII).build());
        entetes.setCacheControl(CacheControl.noStore());
        return new ResponseEntity<>(contenu, entetes, org.springframework.http.HttpStatus.OK);
    }

    /** Réponse HTTP d'un CSV (UTF-8 + BOM pour Excel FR). */
    public ResponseEntity<byte[]> reponseCsv(String nomFichierAscii, String contenu) {
        byte[] corps = contenu.getBytes(StandardCharsets.UTF_8);
        byte[] avecBom = new byte[corps.length + 3];
        avecBom[0] = (byte) 0xEF;
        avecBom[1] = (byte) 0xBB;
        avecBom[2] = (byte) 0xBF;
        System.arraycopy(corps, 0, avecBom, 3, corps.length);

        HttpHeaders entetes = new HttpHeaders();
        entetes.setContentType(new MediaType("text", "csv", StandardCharsets.UTF_8));
        entetes.setContentDisposition(ContentDisposition.attachment()
                .filename(nomFichierAscii, StandardCharsets.US_ASCII).build());
        entetes.setCacheControl(CacheControl.noStore());
        return new ResponseEntity<>(avecBom, entetes, org.springframework.http.HttpStatus.OK);
    }

    /** Empreinte d'intégrité : 12 premiers caractères hexadécimaux du SHA-256. */
    public String empreinte(Object donnees) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] empreinteComplete = digest.digest(String.valueOf(donnees).getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte octet : empreinteComplete) {
                hex.append(String.format("%02x", octet));
            }
            return hex.substring(0, 12).toUpperCase();
        } catch (Exception e) {
            return "000000000000";
        }
    }

    /** Nom de fichier ASCII sûr : FinCo_<document>_<référence>_<horodatage>.pdf */
    public String nomFichierAscii(String document, String reference, String extension) {
        String base = "FinCo_" + ascii(document) + "_" + ascii(reference) + "_"
                + LocalDateTime.now().format(HORODATAGE_FICHIER) + "." + extension;
        return base.replaceAll("[^A-Za-z0-9._-]", "_");
    }

    /** "Grand livre" -> "Grand-livre" : accents retirés, espaces remplacés. */
    public String ascii(String valeur) {
        if (valeur == null || valeur.isBlank()) {
            return "document";
        }
        String sansAccent = java.text.Normalizer.normalize(valeur, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return sansAccent.replaceAll("\\s+", "-").trim();
    }

    public LocalDate aujourdHui() {
        return LocalDate.now();
    }

    public BigDecimal nul(BigDecimal valeur) {
        return valeur == null ? BigDecimal.ZERO : valeur;
    }
}
