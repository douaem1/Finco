import { useEffect, useMemo, useState } from 'react';
import { listerPieces } from '../services/ecritureApi';
import { listerPaiements, validerPaiement } from '../services/paiementApi';
import { messageErreur } from '../services/api';
import { montant, dateFr } from '../utils/format';
import MessageErreur from '../components/MessageErreur';
import Chargement from '../components/Chargement';
import Icone from '../components/Icone';

export default function EspaceDaf() {
  const [pieces, setPieces] = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [action, setAction] = useState(null);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');

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
    const decaissements = paiements.filter((p) => p.valide).reduce((total, p) => total + Number(p.montant), 0);
    const totalEcritures = pieces.reduce((total, p) => total + Number(p.totalDebit || 0), 0);
    const charges = pieces.flatMap((p) => p.lignes || [])
      .filter((ligne) => ligne.sens === 'DEBIT' && ligne.centreCoutCode)
      .reduce((total, ligne) => total + Number(ligne.montant), 0);
    return { enAttente, decaissements, totalEcritures, charges };
  }, [paiements, pieces]);

  async function approuver(paiement) {
    setAction(paiement.id);
    setErreur('');
    setSucces('');
    try {
      const maj = await validerPaiement(paiement.id);
      setPaiements((precedents) => precedents.map((p) => (p.id === maj.id ? maj : p)));
      setSucces(`Paiement du ${dateFr(maj.datePaiement)} validé avec succès.`);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setAction(null);
    }
  }

  return (
    <section>
      <header className="entete-page">
        <div>
          <p className="date-du-jour">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <h1>Espace Direction financière</h1>
          <p className="texte-secondaire">Suivez la situation financière et validez les paiements fournisseurs.</p>
        </div>
      </header>

      <MessageErreur message={erreur} />
      {succes && <p className="message-succes" role="status">{succes}</p>}
      {chargement ? <Chargement /> : (
        <>
          <div className="kpis">
            <Kpi icone="horloge" label="Paiements à valider" valeur={indicateurs.enAttente.length} note="Demandes en attente" />
            <Kpi icone="valide" label="Décaissements validés" valeur={`${montant(indicateurs.decaissements)} MAD`} note="Paiements approuvés" />
            <Kpi icone="pieces" label="Mouvements comptables" valeur={`${montant(indicateurs.totalEcritures)} MAD`} note={`${pieces.length} pièce(s) enregistrée(s)`} />
            <Kpi icone="centres" label="Charges analytiques" valeur={`${montant(indicateurs.charges)} MAD`} note="Charges imputées aux centres" />
          </div>

          <article className="carte">
            <header className="carte-entete">
              <h2><Icone nom="valide" taille={20} /> Validation des paiements</h2>
              <span className="texte-secondaire">{indicateurs.enAttente.length} en attente</span>
            </header>
            {paiements.length === 0 ? <p className="texte-secondaire carte-vide">Aucun paiement enregistré.</p> : (
              <div className="defilement"><table className="tableau"><thead><tr><th>Date</th><th>Factures</th><th>Mode</th><th>Montant</th><th>Statut</th><th>Action</th></tr></thead>
                <tbody>{paiements.map((paiement) => (
                  <tr key={paiement.id}>
                    <td>{dateFr(paiement.datePaiement)}</td>
                    <td>{paiement.factures?.length ? paiement.factures.map((f) => f.numero).join(', ') : 'Non affecté'}</td>
                    <td>{paiement.mode}</td>
                    <td className="chiffres"><strong>{montant(paiement.montant)} MAD</strong></td>
                    <td><span className={`badge ${paiement.valide ? 'badge-succes' : 'badge-avertissement'}`}>{paiement.valide ? 'Validé' : 'À valider'}</span></td>
                    <td>{paiement.valide ? <span className="texte-secondaire">Par {paiement.validePar}</span> : <button type="button" className="btn btn-primaire btn-petit" onClick={() => approuver(paiement)} disabled={action !== null}>{action === paiement.id ? 'Validation...' : 'Valider'}</button>}</td>
                  </tr>
                ))}</tbody>
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
