import { useEffect, useMemo, useState } from 'react';
import { calculerImputations, listerImputations } from '../services/imputationApi';
import { messageErreur } from '../services/api';
import { montant } from '../utils/format';
import MessageErreur from '../components/MessageErreur';
import Chargement from '../components/Chargement';
import Icone from '../components/Icone';

function periodeCourante() {
  return new Date().toLocaleDateString('sv-SE').slice(0, 7);
}

export default function RepartitionCouts() {
  const [periode, setPeriode] = useState(periodeCourante());
  const [imputations, setImputations] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [action, setAction] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');

  useEffect(() => {
    setChargement(true);
    setErreur('');
    listerImputations(periode)
      .then(setImputations)
      .catch((e) => setErreur(messageErreur(e)))
      .finally(() => setChargement(false));
  }, [periode]);

  const dejaCalculee = imputations.length > 0;
  const total = useMemo(() => imputations.reduce((s, i) => s + Number(i.montant), 0), [imputations]);

  async function lancerCalcul() {
    setAction(true);
    setErreur('');
    setSucces('');
    try {
      const resultat = await calculerImputations(periode);
      setImputations(resultat);
      setSucces(resultat.length
        ? `${resultat.length} imputation(s) calculée(s) pour ${periode}.`
        : `Aucune charge auxiliaire validée à répartir pour ${periode}.`);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setAction(false);
    }
  }

  return (
    <section>
      <header className="entete-page"><div><h1>Répartition des coûts</h1><p className="texte-secondaire">Ventilez les charges auxiliaires validées selon les clés des centres principaux.</p></div></header>
      {succes && <p className="message-succes" role="status">{succes}</p>}
      <MessageErreur message={erreur} />
      {chargement ? <Chargement /> : (
        <>
          <div className="panneau panneau-actions">
            <label className="champ"><span className="champ-label">Période</span><input className="input" type="month" value={periode} onChange={(e) => setPeriode(e.target.value)} /></label>
            <div><p className="texte-secondaire">Les charges nettes de classe 6 proviennent des écritures validées de la période.</p><button type="button" className="btn btn-primaire" onClick={lancerCalcul} disabled={action || !periode || dejaCalculee}><Icone nom="repartition" taille={18} /> {action ? 'Calcul…' : dejaCalculee ? 'Période déjà répartie' : 'Calculer la répartition'}</button></div>
          </div>
          {dejaCalculee ? (
            <div className="panneau">
              <div className="barre-outils"><h2>Imputations de {periode}</h2><strong>Total réparti : {montant(total)} MAD</strong></div>
              <div className="defilement"><table className="tableau">
                <thead><tr><th>Centre auxiliaire</th><th>Centre principal</th><th className="num">Montant réparti</th><th>Date du calcul</th></tr></thead>
                <tbody>{imputations.map((i) => <tr key={i.id}><td><span className="code-centre">{i.codeSource}</span> — {i.libelleSource}</td><td><span className="code-centre">{i.codeCible}</span> — {i.libelleCible}</td><td className="num chiffres"><strong>{montant(i.montant)} MAD</strong></td><td>{i.dateCalcul ? new Date(i.dateCalcul).toLocaleString('fr-FR') : '—'}</td></tr>)}</tbody>
              </table></div>
            </div>
          ) : <div className="panneau vide"><Icone nom="repartition" taille={36} /><p><strong>Aucune répartition enregistrée pour cette période.</strong></p><p className="texte-secondaire">Le calcul est définitif pour le mois sélectionné et ne peut être exécuté qu’une fois par centre auxiliaire.</p></div>}
        </>
      )}
    </section>
  );
}
