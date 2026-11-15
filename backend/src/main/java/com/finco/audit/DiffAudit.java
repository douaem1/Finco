package com.finco.audit;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Petit utilitaire de comparaison de deux états d'un objet métier : il ne
 * conserve QUE les champs réellement modifiés, sérialisés en JSON compact.
 * Sert à alimenter ancienneValeur / nouvelleValeur dans le journal d'audit.
 */
public final class DiffAudit {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private DiffAudit() {
    }

    /** Résultat d'une comparaison : JSON avant/après (champs changés uniquement). */
    public record Diff(String ancienneValeur, String nouvelleValeur, boolean aDesChangements) {
    }

    public static Diff comparer(Map<String, ?> avant, Map<String, ?> apres) {
        Map<String, Object> anciens = new LinkedHashMap<>();
        Map<String, Object> nouveaux = new LinkedHashMap<>();
        Map<String, ?> source1 = avant != null ? avant : Map.of();
        Map<String, ?> source2 = apres != null ? apres : Map.of();
        for (Map.Entry<String, ?> entree : source2.entrySet()) {
            Object vApres = entree.getValue();
            Object vAvant = source1.get(entree.getKey());
            if (!java.util.Objects.equals(vAvant, vApres)) {
                anciens.put(entree.getKey(), vAvant);
                nouveaux.put(entree.getKey(), vApres);
            }
        }
        for (Map.Entry<String, ?> entree : source1.entrySet()) {
            if (!source2.containsKey(entree.getKey())) {
                anciens.put(entree.getKey(), entree.getValue());
                nouveaux.put(entree.getKey(), null);
            }
        }
        boolean change = !anciens.isEmpty();
        return new Diff(change ? json(anciens) : null, change ? json(nouveaux) : null, change);
    }

    /** Variante pratique : compare deux objets (records/DTO) convertis en map. */
    public static Diff comparerObjets(Object avant, Object apres) {
        return comparer(versMap(avant), versMap(apres));
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> versMap(Object objet) {
        if (objet == null) {
            return Map.of();
        }
        return MAPPER.convertValue(objet, Map.class);
    }

    public static String json(Object valeur) {
        if (valeur == null) {
            return null;
        }
        try {
            return MAPPER.writeValueAsString(valeur);
        } catch (Exception e) {
            return null;
        }
    }
}
