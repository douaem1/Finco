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
    public UserDetails loadUserByUsername(String login) throws UsernameNotFoundException {
        Utilisateur u = utilisateurRepository.findByLogin(login)
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur inconnu : " + login));

        // Le rôle devient une « autorité » préfixée ROLE_ (convention Spring).
        return User.withUsername(u.getLogin())
                .password(u.getMotDePasse())
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_" + u.getRole().name())))
                .disabled(!u.isActif())
                .build();
    }
}
