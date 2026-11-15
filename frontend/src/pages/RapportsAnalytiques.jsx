import { useEffect, useMemo, useState } from 'react';
import { obtenirRapportAnalytique } from '../services/imputationApi';
import { messageErreur } from '../services/api';
import { montant } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import AsyncState from '../components/ui/AsyncState';
import DataTable, { BasculeDensite, MenuColonnes } from '../components/ui/DataTable';
import Amount from '../components/ui/Amount';
import Button from '../components/ui/Button';
import ExportButton from '../components/ui/ExportButton';

export default function RapportsAnalytiques() {
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [rapport, setRapport] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [rafraichissement, setRafraichissement] = useState(0);
  const [derniereMaj, setDerniereMaj] = useState(null);

  useEffect(() => {
    let actif = true;
    setChargement(true);
    setErreur('');
    obtenirRapportAnalytique(annee)
      .then((data) => { if (actif) { setRapport(data); setDerniereMaj(new Date()); } })
      .catch((e) => { if (actif) setErreur(messageErreur(e)); })
      .finally(() => { if (actif) setChargement(false); });
    return () => { actif = false; };
  }, [annee, rafraichissement]);

  const recharger = () => setRafraichissement((valeur) => valeur + 1);

  const valeurMax = Math.max(1, ...(rapport?.evolution || []).flatMap((m) => [Number(m.charges), Number(m.produits)]));

  const colonnesCentres = useMemo(() => [
    { key: 'code', label: 'Centre', cell: (centre) => ({ principal: centre.code, secondaire: centre.libelle }) },
    { key: 'budget', label: 'Budget', numeric: true, render: (centre) => <Amount value={centre.budget} /> },
    { key: 'reel', label: 'Réel', numeric: true, priorite: 2, render: (centre) => <Amount value={centre.reel} /> },
    { key: 'ecart', label: 'Écart réel - budget', numeric: true, render: (centre) => <strong><Amount value={centre.ecart} /></strong> },
  ], []);

  return (
    <section className="pile-large">
      <PageHeader
        title="Rapports analytiques"
        description="Suivi des charges, produits et budgets à partir des écritures validées."
        actions={(
          <>
            <BasculeDensite />
            <MenuColonnes storageKey="rapports-analytiques" colonnes={colonnesCentres} />
            <label className="champ filtre-annee">
              <span className="champ-label">Exercice</span>
              <input className="input" type="number" min="2000" max="2099" value={annee} onChange={(e) => setAnnee(Number(e.target.value))} />
            </label>
            <Button variant="secondary" type="button" onClick={recharger} loading={chargement}>Actualiser</Button>
            <ExportButton endpoint="/rapports/analytique/export/pdf" format="pdf" params={{ annee }} />
          </>
        )}
      />
      <p className="texte-secondaire">Dernière mise à jour : {derniereMaj ? derniereMaj.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</p>
      <AsyncState
        loading={chargement}
        error={erreur}
        onRetry={recharger}
        empty={!rapport}
        emptyTitle="Aucun rapport disponible"
        emptyDescription="Aucune donnée analytique n’a pu être chargée pour cet exercice."
        emptyAction={<Button variant="secondary" type="button" onClick={recharger}>Réessayer</Button>}
      >
        {rapport && (
          <>
            <div className="kpis">
              <article className="kpi"><p className="kpi-libelle">Charges comptabilisées</p><p className="kpi-valeur"><Amount value={rapport.totalCharges} /></p><p className="kpi-note">Débits des comptes de classe 6</p></article>
              <article className="kpi"><p className="kpi-libelle">Produits comptabilisés</p><p className="kpi-valeur"><Amount value={rapport.totalProduits} /></p><p className="kpi-note">Crédits des comptes de classe 7</p></article>
              <article className="kpi"><p className="kpi-libelle">Résultat analytique</p><p className="kpi-valeur"><Amount value={Number(rapport.totalProduits) - Number(rapport.totalCharges)} /></p><p className="kpi-note">Produits moins charges</p></article>
            </div>
            <div className="grille-tdb">
              <article className="carte">
                <header className="carte-entete"><h2>Activité mensuelle</h2><span className="texte-secondaire">MAD</span></header>
                <div className="graphe-barres graphe-rapport" role="img" aria-label={`Charges et produits mensuels en ${annee}`}>
                  {rapport.evolution.map((mois) => <div key={mois.mois} className="graphe-colonne" title={`${mois.mois} : charges ${montant(mois.charges)}, produits ${montant(mois.produits)}`}><span className="graphe-barre" style={{ '--h': `${Math.max(Number(mois.charges) ? 5 : 2, Number(mois.charges) / valeurMax * 100)}%` }} /><span className="graphe-barre graphe-barre-secondaire" style={{ '--h': `${Math.max(Number(mois.produits) ? 5 : 2, Number(mois.produits) / valeurMax * 100)}%` }} /><span className="graphe-jour">{mois.mois.slice(5)}</span></div>)}
                </div>
                <p className="texte-secondaire"><span className="legende-point" /> Charges <span className="legende-point legende-point-secondaire" /> Produits</p>
              </article>
              <article className="carte">
                <header className="carte-entete"><h2>Réel par centre et budget</h2></header>
                <DataTable columns={colonnesCentres} rows={rapport.centres} rowKey="centreId" storageKey="rapports-analytiques" empty="Aucun budget défini pour cet exercice." />
              </article>
            </div>
          </>
        )}
      </AsyncState>
    </section>
  );
}
