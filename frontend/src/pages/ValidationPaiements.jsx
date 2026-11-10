import { useEffect, useState } from 'react';
import { listerPaiements, validerPaiement } from '../services/paiementApi';
import { messageErreur } from '../services/api';
import { dateFr, montant } from '../utils/format';
import MessageErreur from '../components/MessageErreur';
import Chargement from '../components/Chargement';
import Icone from '../components/Icone';

export default function ValidationPaiements() {
  const [paiements, setPaiements] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [action, setAction] = useState(null);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');

  useEffect(() => {
    listerPaiements()
      .then(setPaiements)
      .catch((e) => setErreur(messageErreur(e)))
      .finally(() => setChargement(false));
  }, []);

  async function approuver(paiement) {
    setAction(paiement.id);
    setErreur('');
    setSucces('');
    try {
      const maj = await validerPaiement(paiement.id);
      setPaiements((precedents) => precedents.map((p) => p.id === maj.id ? maj : p));
      setSucces(`Paiement de ${montant(maj.montant)} MAD validé.`);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setAction(null);
    }
  }

  const enAttente = paiements.filter((p) => !p.valide);

  return (
    <section>
      <header className="entete-page"><div><h1>Validation des paiements</h1><p className="texte-secondaire">Contrôlez les règlements préparés par la comptabilité avant approbation.</p></div><span className="badge badge-avertissement">{enAttente.length} en attente</span></header>
      {succes && <p className="message-succes" role="status">{succes}</p>}
      <MessageErreur message={erreur} />
      {chargement ? <Chargement /> : (
        <div className="panneau">
          <div className="defilement">
            <table className="tableau">
              <thead><tr><th>Date</th><th>Factures</th><th>Mode</th><th className="num">Montant</th><th>Statut</th><th>Action</th></tr></thead>
              <tbody>
                {paiements.map((p) => (
                  <tr key={p.id}>
                    <td className="chiffres">{dateFr(p.datePaiement)}</td>
                    <td>{p.factures?.length ? p.factures.map((f) => `${f.numero} (${montant(f.montantAffecte)} MAD)`).join(', ') : 'Non affecté'}</td>
                    <td>{p.mode}</td>
                    <td className="num chiffres"><strong>{montant(p.montant)} MAD</strong></td>
                    <td><span className={`badge ${p.valide ? 'badge-succes' : 'badge-avertissement'}`}>{p.valide ? 'Validé' : 'À valider'}</span></td>
                    <td>{p.valide ? <span className="texte-secondaire">Par {p.validePar}</span> : <button type="button" className="btn btn-primaire btn-petit" onClick={() => approuver(p)} disabled={action !== null}>{action === p.id ? 'Validation…' : <><Icone nom="valide" taille={16} /> Valider</>}</button>}</td>
                  </tr>
                ))}
                {paiements.length === 0 && <tr><td colSpan={6} className="texte-secondaire aucun-resultat">Aucun paiement soumis à validation.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
