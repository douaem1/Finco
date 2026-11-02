package com.finco.service;

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

    public UtilisateurAdministrationService(UtilisateurRepository utilisateurRepository,
                                            PieceComptableRepository pieceComptableRepository,
                                            PasswordEncoder passwordEncoder) {
        this.utilisateurRepository = utilisateurRepository;
        this.pieceComptableRepository = pieceComptableRepository;
        this.passwordEncoder = passwordEncoder;
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
        return UtilisateurAdministrationResponse.de(utilisateurRepository.save(utilisateur));
    }

    public UtilisateurAdministrationResponse update(Long id, UtilisateurModificationRequest request) {
        Utilisateur utilisateur = trouver(id);
        String email = normaliserEmail(request.email());
        verifierEmailDisponible(email, id);

        utilisateur.setNom(nettoyer(request.nom()));
        utilisateur.setPrenom(nettoyer(request.prenom()));
        utilisateur.setEmail(email);
        utilisateur.setRole(request.role());
        utilisateur.setActif(request.actif());
        if (request.motDePasse() != null && !request.motDePasse().isBlank()) {
            utilisateur.setMotDePasse(passwordEncoder.encode(request.motDePasse()));
        }
        return UtilisateurAdministrationResponse.de(utilisateurRepository.save(utilisateur));
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
