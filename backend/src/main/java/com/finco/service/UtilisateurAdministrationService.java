package com.finco.service;

import com.finco.audit.ActionAudit;
import com.finco.audit.AuditService;
import com.finco.audit.DiffAudit;
import com.finco.dto.UtilisateurAdministrationResponse;
import com.finco.dto.UtilisateurCreationRequest;
import com.finco.dto.UtilisateurModificationRequest;
import com.finco.entity.Utilisateur;
import com.finco.exception.ConflitMetierException;
import com.finco.exception.RegleMetierException;
import com.finco.exception.RessourceIntrouvableException;
import com.finco.repository.PieceComptableRepository;
import com.finco.repository.UtilisateurRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class UtilisateurAdministrationService {

    private final UtilisateurRepository utilisateurRepository;
    private final PieceComptableRepository pieceComptableRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public UtilisateurAdministrationService(UtilisateurRepository utilisateurRepository,
                                            PieceComptableRepository pieceComptableRepository,
                                            PasswordEncoder passwordEncoder,
                                            AuditService auditService) {
        this.utilisateurRepository = utilisateurRepository;
        this.pieceComptableRepository = pieceComptableRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public List<UtilisateurAdministrationResponse> findAll() {
        return utilisateurRepository.findAllByOrderByNomAscPrenomAsc().stream()
                .map(UtilisateurAdministrationResponse::de)
                .toList();
    }

    public UtilisateurAdministrationResponse create(UtilisateurCreationRequest request) {
        String email = normaliserEmail(request.email());
        verifierEmailDisponible(email, null);
        Utilisateur utilisateur = new Utilisateur(
                nettoyer(request.nom()), nettoyer(request.prenom()), email,
                passwordEncoder.encode(request.motDePasse()), request.role());
        Utilisateur enregistre = utilisateurRepository.save(utilisateur);
        auditService.enregistrer(ActionAudit.UTILISATEUR_CREE, "UTILISATEUR", enregistre.getId(), enregistre.getEmail(),
                null,
                DiffAudit.json(java.util.Map.of(
                        "email", enregistre.getEmail(),
                        "role", enregistre.getRole().name(),
                        "actif", enregistre.isActif())),
                "Création de l'utilisateur " + enregistre.getEmail());
        return UtilisateurAdministrationResponse.de(enregistre);
    }

    public UtilisateurAdministrationResponse update(Long id, UtilisateurModificationRequest request) {
        Utilisateur utilisateur = trouver(id);
        String email = normaliserEmail(request.email());
        verifierEmailDisponible(email, id);

        String ancienRole = utilisateur.getRole() != null ? utilisateur.getRole().name() : "";
        boolean ancienActif = utilisateur.isActif();
        java.util.Map<String, Object> avant = java.util.Map.of(
                "nom", utilisateur.getNom(),
                "prenom", utilisateur.getPrenom(),
                "email", utilisateur.getEmail(),
                "role", ancienRole,
                "actif", ancienActif);

        utilisateur.setNom(nettoyer(request.nom()));
        utilisateur.setPrenom(nettoyer(request.prenom()));
        utilisateur.setEmail(email);
        utilisateur.setRole(request.role());
        utilisateur.setActif(request.actif());
        if (request.motDePasse() != null && !request.motDePasse().isBlank()) {
            utilisateur.setMotDePasse(passwordEncoder.encode(request.motDePasse()));
        }
        Utilisateur enregistre = utilisateurRepository.save(utilisateur);

        java.util.Map<String, Object> apres = java.util.Map.of(
                "nom", enregistre.getNom(),
                "prenom", enregistre.getPrenom(),
                "email", enregistre.getEmail(),
                "role", enregistre.getRole() != null ? enregistre.getRole().name() : "",
                "actif", enregistre.isActif());
        DiffAudit.Diff diff = DiffAudit.comparer(avant, apres);
        auditService.enregistrer(ActionAudit.UTILISATEUR_MODIFIE, "UTILISATEUR", enregistre.getId(), enregistre.getEmail(),
                diff.ancienneValeur(), diff.nouvelleValeur(),
                "Modification de l'utilisateur " + enregistre.getEmail());
        if (!ancienRole.equals(apres.get("role"))) {
            auditService.enregistrer(ActionAudit.ROLE_MODIFIE, "UTILISATEUR", enregistre.getId(), enregistre.getEmail(),
                    DiffAudit.json(java.util.Map.of("role", ancienRole)),
                    DiffAudit.json(java.util.Map.of("role", apres.get("role"))),
                    "Changement de rôle de " + enregistre.getEmail());
        }
        if (ancienActif && !enregistre.isActif()) {
            auditService.enregistrer(ActionAudit.UTILISATEUR_DESACTIVE, "UTILISATEUR", enregistre.getId(), enregistre.getEmail(),
                    DiffAudit.json(java.util.Map.of("actif", true)),
                    DiffAudit.json(java.util.Map.of("actif", false)),
                    "Désactivation de l'utilisateur " + enregistre.getEmail());
        }
        return UtilisateurAdministrationResponse.de(enregistre);
    }

    public void delete(Long id) {
        Utilisateur utilisateur = trouver(id);
        if (pieceComptableRepository.existsByUtilisateurId(id)) {
            throw new ConflitMetierException("Cet utilisateur a déjà saisi des pièces comptables : suppression impossible. Désactivez-le plutôt.");
        }
        utilisateurRepository.delete(utilisateur);
    }

    private Utilisateur trouver(Long id) {
        return utilisateurRepository.findById(id)
                .orElseThrow(() -> new RessourceIntrouvableException("Utilisateur introuvable (id = " + id + ")."));
    }

    private void verifierEmailDisponible(String email, Long id) {
        utilisateurRepository.findByEmail(email).ifPresent(existant -> {
            if (id == null || !existant.getId().equals(id)) {
                throw new ConflitMetierException("email", "Cette adresse email est déjà utilisée.");
            }
        });
    }

    private String normaliserEmail(String email) {
        return email.trim().toLowerCase();
    }

    private String nettoyer(String valeur) {
        return valeur.trim();
    }
}
