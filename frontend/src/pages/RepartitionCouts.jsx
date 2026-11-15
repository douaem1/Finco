import { useEffect, useMemo, useState } from 'react';
import { calculerImputations, listerImputations } from '../services/imputationApi';
import { messageErreur } from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import AsyncState from '../components/ui/AsyncState';
import EmptyState from '../components/ui/EmptyState';
import DataTable from '../components/ui/DataTable';
import Amount from '../components/ui/Amount';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
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
    chargerDonnees();
  }, [periode]);

  async function chargerDonnees() {
    setChargement(true);
    setErreur('');
    try {
      const data = await listerImputations(periode);
      setImputations(data);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setChargement(false);
    }
  }

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

  const colonnes = [
    { key: 'codeSource', label: 'Centre auxiliaire', render: (i) => <><span className="code-centre">{i.codeSource}</span> — {i.libelleSource}</> },
    { key: 'codeCible', label: 'Centre principal', render: (i) => <><span className="code-centre">{i.codeCible}</span> — {i.libelleCible}</> },
    { key: 'montant', label: 'Montant réparti', numeric: true, render: (i) => <strong><Amount value={i.montant} /></strong> },
    { key: 'dateCalcul', label: 'Date du calcul', render: (i) => (i.dateCalcul ? new Date(i.dateCalcul).toLocaleString('fr-FR') : '—') },
  ];

  return (
    <section className="pile-large">
      <PageHeader title="Répartition des coûts" description="Ventilez les charges auxiliaires validées selon les clés des centres principaux." />
      {succes && <p className="message-succes" role="status">{succes}</p>}
      <AsyncState loading={chargement} error={erreur} onRetry={chargerDonnees}>
        <div className="panneau panneau-actions">
          <Field id="repartition-periode" label="Période">
            {(props) => <input className="input" type="month" value={periode} onChange={(e) => setPeriode(e.target.value)} {...props} />}
          </Field>
          <div>
            <p className="texte-secondaire">Les charges nettes de classe 6 proviennent des écritures validées de la période.</p>
            <Button type="button" onClick={lancerCalcul} loading={action} disabled={!periode || dejaCalculee}>
              <Icone nom="repartition" taille={18} /> {action ? 'Calcul…' : dejaCalculee ? 'Période déjà répartie' : 'Calculer la répartition'}
            </Button>
          </div>
        </div>
        {dejaCalculee ? (
          <div className="panneau">
            <div className="barre-outils"><h2>Imputations de {periode}</h2><strong>Total réparti : <Amount value={total} /></strong></div>
            <DataTable columns={colonnes} rows={imputations} empty="Aucune imputation pour cette période." />
          </div>
        ) : (
          <EmptyState
            title="Aucune répartition enregistrée pour cette période."
            description="Le calcul est définitif pour le mois sélectionné et ne peut être exécuté qu’une fois par centre auxiliaire."
            action={<Button variant="secondary" type="button" onClick={chargerDonnees}>Actualiser</Button>}
          />
        )}
      </AsyncState>
    </section>
  );
}
