package com.finco.pdf;

/**
 * Construction d'un CSV lisible par Excel francophone :
 * séparateur « ; », guillemets pour les valeurs contenant un séparateur,
 * montants avec la virgule décimale (format documenté : « 1 234,56 »).
 */
public final class CsvBuilder {

    private static final String SEPARATEUR = ";";
    private static final String FIN_LIGNE = "\r\n";

    private final StringBuilder contenu = new StringBuilder();

    public CsvBuilder entete(String... colonnes) {
        return ligne((Object[]) colonnes);
    }

    public CsvBuilder ligne(Object... valeurs) {
        for (int i = 0; i < valeurs.length; i++) {
            if (i > 0) {
                contenu.append(SEPARATEUR);
            }
            contenu.append(cellule(valeurs[i]));
        }
        contenu.append(FIN_LIGNE);
        return this;
    }

    public String build() {
        return contenu.toString();
    }

    private String cellule(Object valeur) {
        String texte = valeur == null ? "" : String.valueOf(valeur);
        if (texte.contains(SEPARATEUR) || texte.contains("\"") || texte.contains("\n") || texte.contains("\r")) {
            return "\"" + texte.replace("\"", "\"\"") + "\"";
        }
        return texte;
    }
}
