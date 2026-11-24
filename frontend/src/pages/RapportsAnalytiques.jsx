import { useEffect, useState } from 'react';
import { obtenirRapportAnalytique } from '../services/imputationApi';
import { messageErreur } from '../services/api';
import { montant } from '../utils/format';
import MessageErreur from '../components/MessageErreur';
import Chargement from '../components/Chargement';

export default function RapportsAnalytiques() {
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [rapport, setRapport] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    let actif = true;
    setChargement(true);
    setErreur('');
    obtenirRapportAnalytique(annee)
      .then((data) => { if (actif) setRapport(data); })
      .catch((e) => { if (actif) setErreur(messageErreur(e)); })
      .finally(() => { if (actif) setChargement(false); });
    return () => { actif = false; };
  }, [annee]);

  const valeurMax = Math.max(1, ...(rapport?.evolution || []).flatMap((m) => [Number(m.charges), Number(m.produits)]));

  return (
    <section>
      <header className="entete-page"><div><h1>Rapports analytiques</h1><p className="texte-secondaire">Suivi des charges, produits et budgets à partir des écritures validées.</p></div><label className="champ filtre-annee"><span className="champ-label">Exercice</span><input className="input" type="number" min="2000" max="2099" value={annee} onChange={(e) => setAnnee(Number(e.target.value))} /></label></header>
      <MessageErreur message={erreur} />
      {chargement ? <Chargement /> : rapport && (
        <>
          <div className="kpis">
            <article className="kpi"><p className="kpi-libelle">Charges comptabilisées</p><p className="kpi-valeur chiffres">{montant(rapport.totalCharges)} <small>MAD</small></p><p className="kpi-note">Débits des comptes de classe 6</p></article>
            <article className="kpi"><p className="kpi-libelle">Produits comptabilisés</p><p className="kpi-valeur chiffres">{montant(rapport.totalProduits)} <small>MAD</small></p><p className="kpi-note">Crédits des comptes de classe 7</p></article>
            <article className="kpi"><p className="kpi-libelle">Résultat analytique</p><p className="kpi-valeur chiffres">{montant(Number(rapport.totalProduits) - Number(rapport.totalCharges))} <small>MAD</small></p><p className="kpi-note">Produits moins charges</p></article>
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
              <div className="defilement"><table className="tableau"><thead><tr><th>Centre</th><th className="num">Budget</th><th className="num">Réel</th><th className="num">Écart réel - budget</th></tr></thead><tbody>
                {rapport.centres.map((centre) => <tr key={centre.centreId}><td><span className="code-centre">{centre.code}</span> — {centre.libelle}</td><td className="num chiffres">{montant(centre.budget)}</td><td className="num chiffres">{montant(centre.reel)}</td><td className="num chiffres"><strong>{montant(centre.ecart)}</strong></td></tr>)}
                {rapport.centres.length === 0 && <tr><td colSpan={4} className="texte-secondaire aucun-resultat">Aucun budget défini pour cet exercice.</td></tr>}
              </tbody></table></div>
            </article>
          </div>
        </>
      )}
    </section>
  );
}
