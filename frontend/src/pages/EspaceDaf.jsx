import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listerPieces } from '../services/ecritureApi';
import { listerPaiements } from '../services/paiementApi';
import { messageErreur } from '../services/api';
import { montant, dateFr } from '../utils/format';
import MessageErreur from '../components/MessageErreur';
import Chargement from '../components/Chargement';
import Icone from '../components/Icone';

export default function EspaceDaf() {
  const [pieces, setPieces] = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    Promise.all([listerPieces(), listerPaiements()])
      .then(([piecesRecues, paiementsRecus]) => {
        setPieces(piecesRecues);
        setPaiements(paiementsRecus);
      })
      .catch((e) => setErreur(messageErreur(e)))
      .finally(() => setChargement(false));
  }, []);

  const indicateurs = useMemo(() => {
    const enAttente = paiements.filter((p) => !p.valide);
    const decaissements = paiements.filter((p) => p.valide)
      .reduce((total, p) => total + Number(p.montant), 0);
    const piecesValidees = pieces.filter((p) => p.validee);
    const mouvements = piecesValidees.reduce((total, p) => total + Number(p.totalDebit || 0), 0);
    const charges = piecesValidees.flatMap((p) => p.lignes || [])
      .filter((ligne) => ligne.sens === 'DEBIT' && ligne.centreCoutCode)
      .reduce((total, ligne) => total + Number(ligne.montant), 0);
    return { enAttente, decaissements, piecesValidees, mouvements, charges };
  }, [paiements, pieces]);

  return (
    <section>
      <header className="entete-page">
        <div>
          <p className="date-du-jour">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <h1>Tableau de bord financier</h1>
          <p className="texte-secondaire">Vue consolidée des écritures, décaissements et validations à traiter.</p>
        </div>
        <Link to="/validation-paiements" className="btn btn-primaire"><Icone nom="valide" taille={18} /> Valider les paiements ({indicateurs.enAttente.length})</Link>
      </header>
      <MessageErreur message={erreur} />
      {chargement ? <Chargement /> : (
        <>
          <div className="kpis">
            <Kpi icone="horloge" label="Paiements à valider" valeur={indicateurs.enAttente.length} note="Demandes en attente" />
            <Kpi icone="valide" label="Décaissements validés" valeur={`${montant(indicateurs.decaissements)} MAD`} note="Règlements approuvés" />
            <Kpi icone="pieces" label="Mouvements comptables" valeur={`${montant(indicateurs.mouvements)} MAD`} note={`${indicateurs.piecesValidees.length} pièce(s) validée(s)`} />
            <Kpi icone="centres" label="Charges analytiques" valeur={`${montant(indicateurs.charges)} MAD`} note="Charges imputées aux centres" />
          </div>
          <article className="carte">
            <header className="carte-entete"><h2>Dernières écritures validées</h2><span className="texte-secondaire">Données comptabilisées</span></header>
            {indicateurs.piecesValidees.length === 0 ? <p className="texte-secondaire carte-vide">Aucune écriture validée.</p> : (
              <div className="defilement"><table className="tableau">
                <thead><tr><th>Pièce</th><th>Date</th><th>Libellé</th><th>Saisie par</th><th className="num">Débit (MAD)</th></tr></thead>
                <tbody>{indicateurs.piecesValidees.slice(0, 8).map((p) => <tr key={p.id}><td><strong>{p.numero}</strong></td><td>{dateFr(p.dateEcriture)}</td><td>{p.libelle}</td><td>{p.saisiePar}</td><td className="num chiffres">{montant(p.totalDebit)}</td></tr>)}</tbody>
              </table></div>
            )}
          </article>
        </>
      )}
    </section>
  );
}

function Kpi({ icone, label, valeur, note }) {
  return <article className="kpi"><span className="kpi-icone"><Icone nom={icone} /></span><p className="kpi-libelle">{label}</p><p className="kpi-valeur chiffres">{valeur}</p><p className="kpi-note">{note}</p></article>;
}
