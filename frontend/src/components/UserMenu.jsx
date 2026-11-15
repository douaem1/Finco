import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { LIBELLES_ROLES, nomAffiche } from '../utils/format';
import { useTheme } from '../context/ThemeContext';
import Icone from './Icone';
import Avatar from './ui/Avatar';

const MODES_THEME = [
  { valeur: 'clair', libelle: 'Clair', icone: 'soleil' },
  { valeur: 'sombre', libelle: 'Sombre', icone: 'lune' },
  { valeur: 'systeme', libelle: 'Système', icone: 'ecran' },
];

/**
 * Bloc profil de la barre supérieure : pastille compacte + menu déroulant.
 * Les entrées de menu dont la page n'existe pas encore sont désactivées.
 */
export default function UserMenu({ utilisateur, role, onLogout, profilDisponible = false, motDePasseDisponible = false }) {
  const nom = nomAffiche(utilisateur) || 'Utilisateur';
  const libelleRole = LIBELLES_ROLES[role] || role || '';
  const { mode, setMode } = useTheme();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button type="button" className="profil-puce" aria-label={`Compte de ${nom}`}>
          <Avatar utilisateur={utilisateur} />
          <span className="profil-identite">
            <strong>{nom}</strong>
            <small>{libelleRole}</small>
          </span>
          <svg className="profil-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="profil-menu" align="end" sideOffset={10} collisionPadding={12}>
          <div className="profil-menu-entete">
            <Avatar utilisateur={utilisateur} grand />
            <span className="profil-menu-texte">
              <strong>{nom}</strong>
              {utilisateur?.email && <small>{utilisateur.email}</small>}
              {libelleRole && <span className="ui-status ui-status-neutral">{libelleRole}</span>}
            </span>
          </div>
          <DropdownMenu.Separator className="profil-separateur" />
          <DropdownMenu.Item className="profil-item" disabled={!profilDisponible} onSelect={undefined}>
            <Icone nom="utilisateurs" taille={18} /> Mon profil
          </DropdownMenu.Item>
          <DropdownMenu.Item className="profil-item" disabled={!motDePasseDisponible} onSelect={undefined}>
            <Icone nom="verrou" taille={18} /> Changer le mot de passe
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="profil-separateur" />
          <DropdownMenu.Label className="profil-etiquette">Thème</DropdownMenu.Label>
          <DropdownMenu.RadioGroup value={mode} onValueChange={setMode}>
            {MODES_THEME.map((entree) => (
              <DropdownMenu.RadioItem
                key={entree.valeur}
                className="profil-item profil-item-theme"
                value={entree.valeur}
                onSelect={(evenement) => evenement.preventDefault()}
              >
                <Icone nom={entree.icone} taille={18} />
                {entree.libelle}
                <DropdownMenu.ItemIndicator className="profil-theme-coche">
                  <Icone nom="coche" taille={16} />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
          <DropdownMenu.Separator className="profil-separateur" />
          <DropdownMenu.Item className="profil-item profil-item-danger" onSelect={onLogout}>
            <Icone nom="sortie" taille={18} /> Se déconnecter
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
