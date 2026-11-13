import { useCallback, useEffect, useState } from 'react';
import { chargerDashboard } from '../api/dashboardApi';
import { messageErreur } from '../services/api';

export function useDashboard(role, filtres) {
  const [donnees, setDonnees] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [actualiseLe, setActualiseLe] = useState(null);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur('');
    try {
      setDonnees(await chargerDashboard(role, filtres));
      setActualiseLe(new Date());
    } catch (error) {
      setErreur(messageErreur(error));
    } finally {
      setChargement(false);
    }
  }, [role, filtres]);

  useEffect(() => { charger(); }, [charger]);

  return { donnees, chargement, erreur, actualiseLe, actualiser: charger };
}