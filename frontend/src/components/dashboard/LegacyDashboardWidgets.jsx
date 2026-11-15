import { useEffect, useMemo, useState } from 'react';
import { listerPieces } from '../../services/ecritureApi';
import { messageErreur } from '../../services/api';
import { dateFr, montant } from '../../utils/format';
import Chargement from '../Chargement';
import MessageErreur from '../MessageErreur';

const JOURS = 14;

function iso(date) {
  return date.toLocaleDateString('sv-SE');
}

function usePiecesPourWidgets() {
  const [pieces, setPieces] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    listerPieces()
      .then(setPieces)
      .catch((error) => setErreur(messageErreur(error)))
      .finally(() => setChargement(false));
  }, []);

  return { pieces, chargement, erreur };
}

function RecentEntriesTable({ pieces, title }) {
  const recentes = pieces.filter((piece) => piece.validee).slice(0, 8);
  return (
    <article className="carte">
      <header className="carte-entete">
        <h2>{title}</h2>
        <span className="texte-secondaire">Données comptabilisées</span>
      </header>
      {recentes.length === 0 ? <p className="texte-secondaire carte-vide">Aucune écriture validée.</p> : (
        <div className="defilement">
          <table className="tableau">
            <thead><tr><th scope="col">Pièce</th><th scope="col">Date</th><th scope="col">Libellé</th><th scope="col">Saisie par</th><th scope="col" className="num">Débit (MAD)</th></tr></thead>
            <tbody>{recentes.map((piece) => (
              <tr key={piece.id}>
                <td><strong>{piece.numero}</strong></td>
                <td>{dateFr(piece.dateEcriture)}</td>
                <td>{piece.libelle}</td>
                <td>{piece.saisiePar}</td>
                <td className="num chiffres">{montant(piece.totalDebit)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </article>
  );
}

export function ComptableLegacyWidgets() {
  const { pieces, chargement, erreur } = usePiecesPourWidgets();
  const stats = useMemo(() => {
    const aujourdHui = new Date();
    const jours = Array.from({ length: JOURS }, (_, index) => {
      const date = new Date(aujourdHui);
      date.setDate(date.getDate() - (JOURS - 1 - index));
      return { cle: iso(date), jour: date.getDate(), total: 0 };
    });
    const parJour = Object.fromEntries(jours.map((jour) => [jour.cle, jour]));
    pieces.forEach((piece) => {
      if (parJour[piece.dateEcriture]) parJour[piece.dateEcriture].total += Number(piece.totalDebit || 0);
    });
    const centres = {};
    pieces.forEach((piece) => (piece.lignes || []).forEach((ligne) => {
      if (ligne.centreCoutCode && ligne.sens === 'DEBIT') {
        centres[ligne.centreCoutCode] = (centres[ligne.centreCoutCode] || 0) + Number(ligne.montant || 0);
      }
    }));
    return { jours, repartition: Object.entries(centres).sort((a, b) => b[1] - a[1]) };
  }, [pieces]);

  if (chargement) return <Chargement />;
  const maxJour = Math.max(...stats.jours.map((jour) => jour.total), 1);
  const maxCentre = Math.max(...stats.repartition.map(([, value]) => value), 1);

  return (
    <>
      <MessageErreur message={erreur} />
      <div className="grille-tdb dashboard-legacy-grid">
        <article className="carte">
          <header className="carte-entete"><h2>Activité des 14 derniers jours</h2><span className="texte-secondaire">MAD</span></header>
          <div className="graphe-barres" role="img" aria-label="Montants saisis par jour sur les 14 derniers jours">
            {stats.jours.map((jour) => <div key={jour.cle} className="graphe-colonne" title={`${dateFr(jour.cle)} : ${montant(jour.total)} MAD`}><span className="graphe-barre" style={{ '--h': `${Math.max(jour.total ? 6 : 2, (jour.total / maxJour) * 100)}%` }} data-vide={jour.total === 0} /><span className="graphe-jour">{jour.jour}</span></div>)}
          </div>
        </article>
        <article className="carte">
          <header className="carte-entete"><h2>Charges par centre de coûts</h2></header>
          {stats.repartition.length === 0 ? <p className="texte-secondaire carte-vide">Aucune charge imputée pour l’instant.</p> : (
            <ul className="repartition">{stats.repartition.map(([code, value]) => <li key={code}><span className="code-centre">{code}</span><span className="repartition-piste"><span style={{ '--largeur': `${(value / maxCentre) * 100}%` }} /></span><b className="chiffres">{montant(value)}</b></li>)}</ul>
          )}
        </article>
      </div>
      <RecentEntriesTable pieces={pieces} title="Dernières écritures" />
    </>
  );
}

export function DirecteurLegacyWidgets() {
  const { pieces, chargement, erreur } = usePiecesPourWidgets();
  if (chargement) return <Chargement />;
  return <><MessageErreur message={erreur} /><RecentEntriesTable pieces={pieces} title="Dernières écritures validées" /></>;
}