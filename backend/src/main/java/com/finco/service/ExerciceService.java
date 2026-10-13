package com.finco.service;

import com.finco.dto.ExerciceRequest;
import com.finco.dto.ExerciceResponse;
import com.finco.entity.Exercice;
import com.finco.entity.Societe;
import com.finco.exception.ConflitMetierException;
import com.finco.exception.RegleMetierException;
import com.finco.exception.RessourceIntrouvableException;
import com.finco.repository.ExerciceRepository;
import com.finco.repository.PieceComptableRepository;
import com.finco.repository.SocieteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Couche métier des exercices comptables.
 * Règles :
 *  1. année obligatoire (2000-2099) et unique ;
 *  2. date de début strictement antérieure à la date de fin ;
 *  3. durée maximale de 12 mois (exercice comptable annuel) ;
 *  4. l'année correspond à l'année de début ou de fin de l'exercice ;
 *  5. deux exercices ne peuvent pas se chevaucher (sinon une date d'écriture serait ambiguë) ;
 *  6. un exercice clôturé ne peut plus être modifié ni supprimé ;
 *  7. modifier les dates ne doit pas laisser de pièces en dehors de la nouvelle période ;
 *  8. clôture : plus aucune pièce en brouillon, et les exercices antérieurs déjà clôturés ;
 *  9. un exercice contenant des pièces comptables ne peut pas être supprimé.
 */
@Service
@Transactional
public class ExerciceService {

    private static final DateTimeFormatter FORMAT_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final ExerciceRepository exerciceRepository;
    private final PieceComptableRepository pieceComptableRepository;
    private final SocieteRepository societeRepository;

    public ExerciceService(ExerciceRepository exerciceRepository,
                           PieceComptableRepository pieceComptableRepository,
                           SocieteRepository societeRepository) {
        this.exerciceRepository = exerciceRepository;
        this.pieceComptableRepository = pieceComptableRepository;
        this.societeRepository = societeRepository;
    }

    @Transactional(readOnly = true)
    public List<ExerciceResponse> findAll() {
        return exerciceRepository.findAllByOrderByAnneeDesc().stream()
                .map(ExerciceResponse::de)
                .toList();
    }

    @Transactional(readOnly = true)
    public ExerciceResponse findById(Long id) {
        return ExerciceResponse.de(getOuErreur(id));
    }

    public ExerciceResponse create(ExerciceRequest req) {
        validerPeriode(req, null);
        Exercice ex = new Exercice(req.annee(), req.dateDebut(), req.dateFin());
        ex.setSociete(resoudreSociete(req.societeId()));
        return ExerciceResponse.de(exerciceRepository.save(ex));
    }

    public ExerciceResponse update(Long id, ExerciceRequest req) {
        Exercice ex = getOuErreur(id);
        if (ex.isCloture()) {
            throw new RegleMetierException(
                    "L'exercice « " + ex.getAnnee() + " » est clôturé et ne peut plus être modifié.");
        }
        validerPeriode(req, id);
        // Règle 7 : les pièces déjà saisies doivent rester dans la période.
        if (pieceComptableRepository.existsByExerciceIdAndDateEcritureBefore(id, req.dateDebut())
                || pieceComptableRepository.existsByExerciceIdAndDateEcritureAfter(id, req.dateFin())) {
            throw new RegleMetierException("dateDebut",
                    "Des pièces comptables de cet exercice sortiraient de la nouvelle période : modification impossible.");
        }
        ex.setAnnee(req.annee());
        ex.setDateDebut(req.dateDebut());
        ex.setDateFin(req.dateFin());
        ex.setSociete(resoudreSociete(req.societeId()));
        return ExerciceResponse.de(exerciceRepository.save(ex));
    }

    /**
     * Clôture d'un exercice : marque cloture = true. Après clôture, plus aucune saisie
     * n'est possible sur la période (contrôlé par PieceComptableService).
     */
    public ExerciceResponse cloturer(Long id) {
        Exercice ex = getOuErreur(id);
        if (ex.isCloture()) {
            throw new RegleMetierException("L'exercice « " + ex.getAnnee() + " » est déjà clôturé.");
        }
        if (exerciceRepository.existsByDateFinBeforeAndClotureFalse(ex.getDateDebut())) {
            throw new RegleMetierException(
                    "Un exercice antérieur n'est pas encore clôturé : les exercices se clôturent dans l'ordre chronologique.");
        }
        if (pieceComptableRepository.existsByExerciceIdAndValideeFalse(id)) {
            throw new RegleMetierException("L'exercice « " + ex.getAnnee()
                    + " » contient encore des pièces en brouillon : validez-les avant la clôture.");
        }
        ex.setCloture(true);
        return ExerciceResponse.de(exerciceRepository.save(ex));
    }

    public void delete(Long id) {
        Exercice ex = getOuErreur(id);
        if (ex.isCloture()) {
            throw new RegleMetierException("L'exercice « " + ex.getAnnee() + " » est clôturé : suppression impossible.");
        }
        if (pieceComptableRepository.existsByExerciceId(id)) {
            throw new ConflitMetierException(
                    "L'exercice « " + ex.getAnnee() + " » contient des pièces comptables : suppression impossible.");
        }
        exerciceRepository.delete(ex);
    }

    // ---------------------------------------------------------------- règles

    private Exercice getOuErreur(Long id) {
        return exerciceRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException(
                        "Exercice introuvable (id = " + id + ")."));
    }

    /** Règles 1 à 5. @param idExclu exercice modifié (null à la création) */
    private void validerPeriode(ExerciceRequest req, Long idExclu) {
        if (req == null) {
            throw new RegleMetierException("Aucune donnée reçue.");
        }
        if (req.annee() == null) {
            throw new RegleMetierException("annee", "L'année est obligatoire.");
        }
        LocalDate debut = req.dateDebut();
        LocalDate fin = req.dateFin();
        if (debut == null) {
            throw new RegleMetierException("dateDebut", "La date de début est obligatoire.");
        }
        if (fin == null) {
            throw new RegleMetierException("dateFin", "La date de fin est obligatoire.");
        }
        if (!debut.isBefore(fin)) {
            throw new RegleMetierException("dateFin",
                    "La date de début doit être strictement antérieure à la date de fin.");
        }
        if (fin.isAfter(debut.plusYears(1).minusDays(1))) {
            throw new RegleMetierException("dateFin",
                    "Un exercice comptable ne peut pas dépasser 12 mois (fin au plus tard le "
                            + debut.plusYears(1).minusDays(1).format(FORMAT_DATE) + ").");
        }
        if (req.annee() != debut.getYear() && req.annee() != fin.getYear()) {
            throw new RegleMetierException("annee",
                    "L'année doit correspondre à l'année de début ou de fin de l'exercice.");
        }
        boolean anneePrise = idExclu == null ? exerciceRepository.existsByAnnee(req.annee())
                : exerciceRepository.existsByAnneeAndIdNot(req.annee(), idExclu);
        if (anneePrise) {
            throw new ConflitMetierException("annee", "Un exercice pour l'année « " + req.annee() + " » existe déjà.");
        }
        if (exerciceRepository.chevauche(debut, fin, idExclu)) {
            throw new ConflitMetierException("dateDebut",
                    "Cette période chevauche un autre exercice : deux exercices ne peuvent pas se recouvrir.");
        }
    }

    private Societe resoudreSociete(Long societeId) {
        if (societeId == null) return null;
        return societeRepository.findById(societeId)
                .orElseThrow(() -> new RessourceIntrouvableException(
                        "Société introuvable (id = " + societeId + ")."));
    }
}
