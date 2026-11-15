import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import Icone from './Icone';

/** Icône affichée selon le type de notification (donnée fournie par l'appelant). */
const ICONES_TYPE = {
  piece: 'journal',
  facture: 'factures',
  paiement: 'paiements',
  alerte: 'valide',
  info: 'rapport',
};

function tempsRelatif(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const secondes = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (secondes < 60) return "à l'instant";
  const minutes = Math.round(secondes / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.round(minutes / 60);
  if (heures < 24) return `il y a ${heures} h`;
  const jours = Math.round(heures / 24);
  if (jours < 7) return `il y a ${jours} j`;
  return date.toLocaleDateString('fr-FR');
}

/**
 * Cloche de notifications. Les données arrivent par `items` afin qu'une source
 * réelle puisse être branchée plus tard sans changer le composant.
 *
 * item = { id, type, titre, texte, date, lu }
 */
export default function NotificationBell({ items = [], onToutMarquerLu, onOuvrirNotification, ariaLabel = 'Notifications' }) {
  const nonLues = items.filter((item) => !item.lu).length;
  const badge = nonLues > 9 ? '9+' : String(nonLues);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button type="button" className="cloche" aria-label={nonLues ? `${ariaLabel} — ${nonLues} non lue${nonLues > 1 ? 's' : ''}` : ariaLabel}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" />
            <path d="M13.7 20a2 2 0 0 1-3.4 0" />
          </svg>
          {nonLues > 0 && <span className="cloche-badge" aria-hidden="true">{badge}</span>}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="notifications" align="end" sideOffset={10} collisionPadding={12}>
          <div className="notifications-entete">
            <strong>Notifications</strong>
            {nonLues > 0 && <button type="button" className="notifications-action" onClick={onToutMarquerLu}>Tout marquer comme lu</button>}
          </div>
          <div className="notifications-liste">
            {items.length === 0 && (
              <div className="notifications-vide">
                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" />
                  <path d="M13.7 20a2 2 0 0 1-3.4 0" />
                </svg>
                <span>Aucune notification</span>
                <small>Vous êtes à jour.</small>
              </div>
            )}
            {items.map((item) => (
              <DropdownMenu.Item key={item.id} className="notification-element" onSelect={() => onOuvrirNotification?.(item)}>
                <span className="notification-icone" aria-hidden="true"><Icone nom={ICONES_TYPE[item.type] || 'rapport'} taille={18} /></span>
                <span className="notification-texte">
                  <strong>{item.titre}</strong>
                  <small>{item.texte}</small>
                  <em>{tempsRelatif(item.date)}</em>
                </span>
                {!item.lu && <span className="notification-point" aria-label="Non lue" />}
              </DropdownMenu.Item>
            ))}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
