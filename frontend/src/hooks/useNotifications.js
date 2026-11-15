import { useCallback, useEffect, useRef, useState } from 'react';
import {
  compterNotificationsNonLues,
  listerNotifications,
  marquerNotificationLue,
  toutMarquerNotificationsLues,
} from '../services/notificationApi';

const INTERVALLE_COMPTEUR = 30000;

/** Titre court affiché dans la cloche, par type de notification. */
const TITRES = {
  PAIEMENT_A_VALIDER: 'Paiement à valider',
  PAIEMENT_VALIDE: 'Paiement validé',
  PAIEMENT_REJETE: 'Paiement rejeté',
  FACTURE_PAYEE: 'Facture payée',
  EXERCICE_CLOTURE: 'Exercice clôturé',
  BUDGET_DEPASSE: 'Budget dépassé',
};

function versItem(notification) {
  return {
    id: notification.id,
    type: notification.type,
    severite: notification.severite,
    titre: TITRES[notification.type] || 'Notification',
    texte: notification.message,
    date: notification.dateCreation,
    lien: notification.lien,
    lu: Boolean(notification.lu),
  };
}

/**
 * Fournit le compteur et la liste des notifications de l'utilisateur courant.
 * Le compteur est rafraîchi toutes les 30 s, uniquement quand l'onglet est visible.
 * Toute erreur est silencieuse : la cloche ne doit jamais casser l'application.
 */
export function useNotifications() {
  const [items, setItems] = useState([]);
  const [compteur, setCompteur] = useState(0);
  const [chargement, setChargement] = useState(false);
  const monte = useRef(true);

  const rafraichirCompteur = useCallback(async () => {
    try {
      const valeur = await compterNotificationsNonLues();
      if (monte.current) setCompteur(valeur);
    } catch {
      /* erreur réseau silencieuse */
    }
  }, []);

  const chargerListe = useCallback(async () => {
    setChargement(true);
    try {
      const donnees = await listerNotifications({ page: 0, size: 20 });
      if (monte.current) setItems((donnees.content || []).map(versItem));
    } catch {
      /* erreur réseau silencieuse */
    } finally {
      if (monte.current) setChargement(false);
    }
  }, []);

  const marquerLue = useCallback(async (id) => {
    setItems((liste) => liste.map((item) => (item.id === id ? { ...item, lu: true } : item)));
    setCompteur((valeur) => Math.max(0, valeur - 1));
    try {
      await marquerNotificationLue(id);
    } catch {
      rafraichirCompteur();
    }
  }, [rafraichirCompteur]);

  const toutMarquerLu = useCallback(async () => {
    setItems((liste) => liste.map((item) => ({ ...item, lu: true })));
    setCompteur(0);
    try {
      await toutMarquerNotificationsLues();
    } catch {
      rafraichirCompteur();
    }
  }, [rafraichirCompteur]);

  useEffect(() => {
    monte.current = true;
    rafraichirCompteur();

    const minuteur = window.setInterval(() => {
      if (document.visibilityState === 'visible') rafraichirCompteur();
    }, INTERVALLE_COMPTEUR);

    function surChangementVisibilite() {
      if (document.visibilityState === 'visible') rafraichirCompteur();
    }
    document.addEventListener('visibilitychange', surChangementVisibilite);

    return () => {
      monte.current = false;
      window.clearInterval(minuteur);
      document.removeEventListener('visibilitychange', surChangementVisibilite);
    };
  }, [rafraichirCompteur]);

  return { items, compteur, chargement, chargerListe, marquerLue, toutMarquerLu };
}
