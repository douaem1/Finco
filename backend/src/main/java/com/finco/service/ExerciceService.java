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

import java.util.List;

/**
 * Couche métier des exercices comptables.
 * Règles :
 * - L'année doit être unique (par societe si fournie, sinon globale).
 * - La date de début doit être strictement antérieure à la date de fin.
 * - Un exercice clôturé ne peut plus être modifié (hors rouverture explicite).
 * - Un exercice lié à des pièces comptables ne peut pas être supprimé.
 */
@Service
@Transactional
public class ExerciceService {

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
        validerDates(req);

        if (exerciceRepository.existsByAnnee(req.annee())) {
            throw new ConflitMetierException(
                    "Un exercice pour l'année « " + req.annee() + " » existe déjà.");
        }

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

        validerDates(req);

        if (exerciceRepository.existsByAnneeAndIdNot(req.annee(), id)) {
            throw new ConflitMetierException(
                    "Un exercice pour l'année « " + req.annee() + " » existe déjà.");
        }

        ex.setAnnee(req.annee());
        ex.setDateDebut(req.dateDebut());
        ex.setDateFin(req.dateFin());
        ex.setSociete(resoudreSociete(req.societeId()));
        return ExerciceResponse.de(exerciceRepository.save(ex));
    }

    /**
     * Clôture d'un exercice : marque cloture = true.
     * Un exercice déjà clôturé ne peut pas être clôturé une seconde fois.
     */
    public ExerciceResponse cloturer(Long id) {
        Exercice ex = getOuErreur(id);
        if (ex.isCloture()) {
            throw new RegleMetierException(
                    "L'exercice « " + ex.getAnnee() + " » est déjà clôturé.");
        }
        ex.setCloture(true);
        return ExerciceResponse.de(exerciceRepository.save(ex));
    }

    public void delete(Long id) {
        Exercice ex = getOuErreur(id);
        if (pieceComptableRepository.existsByExerciceId(id)) {
            throw new ConflitMetierException(
                    "L'exercice « " + ex.getAnnee() + " » contient des pièces comptables : suppression impossible.");
        }
        exerciceRepository.delete(ex);
    }

    // ---------------------------------------------------------------- helpers

    private Exercice getOuErreur(Long id) {
        return exerciceRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException(
                        "Exercice introuvable (id = " + id + ")."));
    }

    private void validerDates(ExerciceRequest req) {
        if (req.dateDebut() != null && req.dateFin() != null
                && !req.dateDebut().isBefore(req.dateFin())) {
            throw new RegleMetierException(
                    "La date de début doit être strictement antérieure à la date de fin.");
        }
    }

    private Societe resoudreSociete(Long societeId) {
        if (societeId == null) return null;
        return societeRepository.findById(societeId)
                .orElseThrow(() -> new RessourceIntrouvableException(
                        "Société introuvable (id = " + societeId + ")."));
    }
}
