package com.finco.pdf;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Aides de mise en forme utilisées par les gabarits PDF (Thymeleaf).
 * Exposé dans le contexte sous le nom « fmt » : ${fmt.mad(x)}.
 *
 * Les montants sont formatés « 1 234,56 » (séparateur de milliers = espace
 * insécable, virgule décimale) pour rester lisibles et alignables en colonne.
 */
public final class Formats {

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATE_HEURE = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    public Formats() {
    }

    /** 1234.5 -> "1 234,56" (espace insécable comme séparateur de milliers). */
    public String nombre(BigDecimal valeur) {
        if (valeur == null) {
            return "0,00";
        }
        BigDecimal arrondi = valeur.setScale(2, RoundingMode.HALF_UP);
        boolean negatif = arrondi.signum() < 0;
        String brut = arrondi.abs().toPlainString();
        int point = brut.indexOf('.');
        String entiere = point < 0 ? brut : brut.substring(0, point);
        String decimale = point < 0 ? "00" : brut.substring(point + 1);

        StringBuilder groupee = new StringBuilder();
        int compteur = 0;
        for (int i = entiere.length() - 1; i >= 0; i--) {
            groupee.append(entiere.charAt(i));
            compteur++;
            if (compteur % 3 == 0 && i > 0) {
                groupee.append('\u00A0');
            }
        }
        String resultat = groupee.reverse() + "," + decimale;
        return negatif ? "−" + resultat : resultat;
    }

    /** 1234.5 -> "1 234,56 MAD". */
    public String mad(BigDecimal valeur) {
        return nombre(valeur) + " MAD";
    }

    /** 0.8765 -> "87,65 %". */
    public String pourcent(BigDecimal ratio) {
        if (ratio == null) {
            return "0,00 %";
        }
        return nombre(ratio.multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP)) + " %";
    }

    public String date(LocalDate valeur) {
        return valeur == null ? "" : valeur.format(DATE);
    }

    public String dateHeure(LocalDateTime valeur) {
        return valeur == null ? "" : valeur.format(DATE_HEURE);
    }
}
