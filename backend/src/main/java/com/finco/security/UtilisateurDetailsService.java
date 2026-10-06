package com.finco.security;

import com.finco.entity.Utilisateur;
import com.finco.repository.UtilisateurRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Pont entre NOTRE table `utilisateur` et Spring Security.
 * Spring Security appelle loadUserByUsername() à la connexion (pour comparer
 * le mot de passe) et à chaque requête authentifiée par JWT.
 */
@Service
public class UtilisateurDetailsService implements UserDetailsService {

    private final UtilisateurRepository utilisateurRepository;

    /** Injection par constructeur : Spring fournit le Bean UtilisateurRepository. */
    public UtilisateurDetailsService(UtilisateurRepository utilisateurRepository) {
        this.utilisateurRepository = utilisateurRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // L'email sert d'identifiant (« username » pour Spring Security).
        Utilisateur u = utilisateurRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur inconnu : " + email));

        // Le rôle devient une « autorité » préfixée ROLE_ (convention Spring).
        return User.withUsername(u.getEmail())
                .password(u.getMotDePasse())
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_" + u.getRole().name())))
                .disabled(!u.isActif())
                .build();
    }
}
