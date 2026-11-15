package com.finco.service;

import com.finco.dto.PaiementDirectionResponse;
import com.finco.dto.PaiementRequest;
import com.finco.dto.AllocationPaiementRequest;
import com.finco.entity.AllocationPaiement;
import com.finco.entity.Facture;
import com.finco.entity.Paiement;
import com.finco.entity.Utilisateur;
import com.finco.entity.enums.ModePaiement;
import com.finco.entity.enums.Role;
import com.finco.entity.enums.StatutFacture;
import com.finco.exception.ConflitMetierException;
import com.finco.exception.RegleMetierException;
import com.finco.exception.RessourceIntrouvableException;
import com.finco.notification.NotificationEvenement;
import com.finco.notification.SeveriteNotification;
import com.finco.notification.TypeNotification;
import com.finco.repository.AllocationPaiementRepository;
import com.finco.repository.FactureRepository;
import com.finco.repository.PaiementRepository;
import com.finco.repository.UtilisateurRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;

import java.util.List;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.Set;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Map;
import java.util.LinkedHashMap;

@Service
@Transactional
public class PaiementDirectionService {
    private static final DateTimeFormatter FORMAT_DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final PaiementRepository paiementRepository;
    private final AllocationPaiementRepository allocationRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final FactureRepository factureRepository;
    private final ApplicationEventPublisher evenementPublisher;

    public PaiementDirectionService(PaiementRepository paiementRepository,
                                    AllocationPaiementRepository allocationRepository,
                                    UtilisateurRepository utilisateurRepository,
                                    FactureRepository factureRepository,
                                    ApplicationEventPublisher evenementPublisher) {
        this.paiementRepository = paiementRepository;
        this.allocationRepository = allocationRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.factureRepository = factureRepository;
        this.evenementPublisher = evenementPublisher;
    }

    @Transactional(readOnly = true)
    public List<PaiementDirectionResponse> lister() {
        return paiementRepository.findAllByOrderByDatePaiementDescIdDesc().stream()
                .map(p -> PaiementDirectionResponse.depuis(p, allocations(p)))
                .toList();
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public PaiementDirectionResponse creer(PaiementRequest request) {
        if (request == null || request.datePaiement() == null) {
            throw new RegleMetierException("datePaiement", "La date du paiement est obligatoire.");
        }
        if (request.datePaiement().isAfter(LocalDate.now())) {
            throw new RegleMetierException("datePaiement", "La date du paiement ne peut pas être dans le futur.");
        }
        ModePaiement mode = modeDepuis(request.mode());
        if (request.allocations() == null || request.allocations().isEmpty()) {
            throw new RegleMetierException("allocations", "Un paiement doit être affecté à au moins une facture.");
        }
        List<AllocationPaiementRequest> demandes = new ArrayList<>(request.allocations());
        if (demandes.stream().anyMatch(a -> a == null || a.factureId() == null || a.montantAffecte() == null)) {
            throw new RegleMetierException("allocations", "Chaque affectation doit préciser une facture et un montant.");
        }
        demandes.sort(Comparator.comparing(AllocationPaiementRequest::factureId));

        BigDecimal total = BigDecimal.ZERO.setScale(2);
        Set<Long> facturesDejaVues = new HashSet<>();
        Map<Long, Facture> facturesSelectionnees = new HashMap<>();
        for (AllocationPaiementRequest allocation : demandes) {
            if (!facturesDejaVues.add(allocation.factureId())) {
                throw new RegleMetierException("allocations", "Une facture ne peut apparaître qu'une seule fois dans un paiement.");
            }
            BigDecimal montant = verifierMontantAffecte(allocation.montantAffecte());
            Facture facture = factureRepository.findByIdForUpdate(allocation.factureId())
                    .orElseThrow(() -> new RegleMetierException("allocations", "Une facture sélectionnée est introuvable."));
            facturesSelectionnees.put(facture.getId(), facture);
            if (facture.getStatut() == StatutFacture.BROUILLON) {
                throw new RegleMetierException("allocations", "Seules les factures validées peuvent être réglées.");
            }
            BigDecimal dejaAffecte = allocationRepository.totalAffecte(facture.getId());
            BigDecimal plafond = facture.calculerTTC();
            if (dejaAffecte.add(montant).compareTo(plafond) > 0) {
                throw new RegleMetierException("allocations",
                        "Le montant affecté dépasse le solde de la facture " + facture.getNumero() + ".");
            }
            total = total.add(montant);
        }
        if (total.precision() - total.scale() > 13) {
            throw new RegleMetierException("allocations", "Le total du paiement dépasse le montant maximal autorisé.");
        }

        Paiement paiement = paiementRepository.save(new Paiement(request.datePaiement(), total, mode));
        List<AllocationPaiement> allocations = demandes.stream()
                .map(a -> new AllocationPaiement(a.montantAffecte().setScale(2), paiement,
                        facturesSelectionnees.get(a.factureId())))
                .toList();
        allocationRepository.saveAll(allocations);
        evenementPublisher.publishEvent(new NotificationEvenement(
                TypeNotification.PAIEMENT_A_VALIDER,
                SeveriteNotification.WARNING,
                "Un paiement de " + montant(total) + " MAD attend votre validation.",
                "/validation-paiements",
                "PAIEMENT",
                paiement.getId(),
                null,
                List.of(NotificationEvenement.Cible.role(Role.DIRECTEUR_FINANCIER))));
        return PaiementDirectionResponse.depuis(paiement, allocations);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public PaiementDirectionResponse valider(Long id, String email) {
        Paiement paiement = paiementRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Paiement introuvable (id = " + id + ")."));
        if (paiement.getValidePar() == null) {
            List<AllocationPaiement> allocations = allocations(paiement);
            Map<Long, Facture> facturesVerrouillees = new LinkedHashMap<>();
            allocations.stream()
                    .map(a -> a.getFacture().getId())
                    .sorted()
                    .forEach(factureId -> factureRepository.findByIdForUpdate(factureId)
                            .ifPresent(f -> facturesVerrouillees.put(factureId, f)));
            List<BigDecimal> montantsDejaPayes = allocations.stream()
                    .map(a -> allocationRepository.totalAffecteValide(a.getFacture().getId()))
                    .toList();
            Utilisateur valideur = utilisateurRepository.findByEmail(email)
                    .orElseThrow(() -> new RessourceIntrouvableException("Valideur introuvable."));
            paiement.setValidePar(valideur);
            paiementRepository.save(paiement);
            List<Facture> facturesPayees = new ArrayList<>();
            for (int i = 0; i < allocations.size(); i++) {
                AllocationPaiement allocation = allocations.get(i);
                Facture facture = facturesVerrouillees.get(allocation.getFacture().getId());
                if (facture == null) {
                    throw new RessourceIntrouvableException("Une facture affectée au paiement est introuvable.");
                }
                BigDecimal totalPaye = montantsDejaPayes.get(i).add(allocation.getMontantAffecte());
                facture.setStatut(totalPaye.compareTo(facture.calculerTTC()) >= 0
                        ? StatutFacture.PAYEE : StatutFacture.VALIDEE);
                if (facture.getStatut() == StatutFacture.PAYEE) {
                    facturesPayees.add(facture);
                }
            }
            evenementPublisher.publishEvent(new NotificationEvenement(
                    TypeNotification.PAIEMENT_VALIDE,
                    SeveriteNotification.INFO,
                    "Votre paiement du " + paiement.getDatePaiement().format(FORMAT_DATE)
                            + " (" + montant(paiement.getMontant()) + " MAD) a été validé.",
                    "/paiements",
                    "PAIEMENT",
                    paiement.getId(),
                    valideur.getId(),
                    List.of(NotificationEvenement.Cible.role(Role.COMPTABLE))));
            for (Facture facture : facturesPayees) {
                evenementPublisher.publishEvent(new NotificationEvenement(
                        TypeNotification.FACTURE_PAYEE,
                        SeveriteNotification.INFO,
                        "La facture " + facture.getNumero() + " est payée ("
                                + montant(facture.calculerTTC()) + " MAD).",
                        "/factures",
                        "FACTURE",
                        facture.getId(),
                        valideur.getId(),
                        List.of(NotificationEvenement.Cible.role(Role.COMPTABLE))));
            }
        }
        return PaiementDirectionResponse.depuis(paiement, allocations(paiement));
    }

    /**
     * Rejet d'un paiement par la direction financière. Aucune écriture comptable n'est
     * générée : les factures liées conservent leur statut précédent.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public PaiementDirectionResponse rejeter(Long id, String motif, String email) {
        Paiement paiement = paiementRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Paiement introuvable (id = " + id + ")."));
        if (paiement.getValidePar() != null) {
            throw new ConflitMetierException("Ce paiement est déjà validé : il ne peut plus être rejeté.");
        }
        if (paiement.getRejetePar() != null) {
            throw new ConflitMetierException("Ce paiement a déjà été rejeté.");
        }
        Utilisateur rejeteur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> new RessourceIntrouvableException("Rejeteur introuvable."));
        paiement.setMotifRejet(motif);
        paiement.setDateRejet(LocalDateTime.now());
        paiement.setRejetePar(rejeteur);
        paiementRepository.save(paiement);
        evenementPublisher.publishEvent(new NotificationEvenement(
                TypeNotification.PAIEMENT_REJETE,
                SeveriteNotification.CRITICAL,
                "Paiement rejeté : " + motif + ".",
                "/paiements",
                "PAIEMENT",
                paiement.getId(),
                rejeteur.getId(),
                List.of(NotificationEvenement.Cible.role(Role.COMPTABLE))));
        return PaiementDirectionResponse.depuis(paiement, allocations(paiement));
    }

    private ModePaiement modeDepuis(String valeur) {
        if (valeur != null) {
            for (ModePaiement mode : ModePaiement.values()) {
                if (mode.name().equals(valeur)) return mode;
            }
        }
        throw new RegleMetierException("mode", "Le mode de paiement est invalide.");
    }

    private BigDecimal verifierMontantAffecte(BigDecimal montant) {
        if (montant.signum() <= 0 || montant.scale() > 2 || montant.precision() - montant.scale() > 13) {
            throw new RegleMetierException("allocations", "Le montant affecté doit être positif, avec deux décimales maximum.");
        }
        return montant.setScale(2, RoundingMode.UNNECESSARY);
    }

    private List<AllocationPaiement> allocations(Paiement paiement) {
        return allocationRepository.findAllByPaiementIdWithFacture(paiement.getId());
    }

    /** Montant lisible pour un message de notification, ex. "1000.00". */
    private String montant(BigDecimal valeur) {
        return valeur == null ? "0" : valeur.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }
}
