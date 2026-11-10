import { useEffect, useMemo, useState } from 'react';
import { enregistrerPaiement, listerPaiements } from '../services/paiementApi';
import { listerFactures } from '../services/factureApi';
import { messageErreur } from '../services/api';
import { dateFr, montant } from '../utils/format';
import MessageErreur from '../components/MessageErreur';
import Chargement from '../components/Chargement';
import Icone from '../components/Icone';

const MODES = [
  ['VIREMENT', 'Virement'], ['CHEQUE', 'Chèque'], ['ESPECES', 'Espèces'], ['EFFET', 'Effet'],
];

export default function Paiements() {
  const [paiements, setPaiements] = useState([]);
  const [factures, setFactures] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [action, setAction] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [datePaiement, setDatePaiement] = useState(new Date().toLocaleDateString('sv-SE'));
  const [mode, setMode] = useState('VIREMENT');
  const [allocations, setAllocations] = useState([{ factureId: '', montantAffecte: '' }]);
  const [erreurModale, setErreurModale] = useState('');

  useEffect(() => {
    Promise.all([listerPaiements(), listerFactures()])
      .then(([p, f]) => {
        setPaiements(p);
        setFactures(f);
      })
      .catch((e) => setErreur(messageErreur(e)))
      .finally(() => setChargement(false));
  }, []);

  function montantDejaAffecte(factureId) {
    return paiements.reduce((total, paiement) => total + (paiement.factures || [])
      .filter((f) => f.id === factureId)
      .reduce((sousTotal, f) => sousTotal + Number(f.montantAffecte), 0), 0);
  }

  const facturesReglables = useMemo(() => factures.filter((f) => f.statut === 'VALIDEE'), [factures]);
  const totalSaisi = allocations.reduce((total, a) => total + (Number(a.montantAffecte) || 0), 0);

  function modifierAllocation(index, champ, valeur) {
    setAllocations((precedentes) => precedentes.map((a, i) => i === index ? { ...a, [champ]: valeur } : a));
  }

  function ouvrirCreation() {
    setDatePaiement(new Date().toLocaleDateString('sv-SE'));
    setMode('VIREMENT');
    setAllocations([{ factureId: '', montantAffecte: '' }]);
    setErreurModale('');
    setModaleOuverte(true);
  }

  async function enregistrer(e) {
    e.preventDefault();
    const lignes = allocations.filter((a) => a.factureId && a.montantAffecte);
    if (!datePaiement || lignes.length === 0 || lignes.some((a) => Number(a.montantAffecte) <= 0)) {
      setErreurModale('Saisissez une date et au moins une affectation avec un montant positif.');
      return;
    }
    if (new Set(lignes.map((a) => a.factureId)).size !== lignes.length) {
      setErreurModale('Chaque facture ne peut être sélectionnée qu’une fois.');
      return;
    }
    setAction(true);
    setErreurModale('');
    try {
      const cree = await enregistrerPaiement({
        datePaiement,
        mode,
        allocations: lignes.map((a) => ({ factureId: Number(a.factureId), montantAffecte: Number(a.montantAffecte) })),
      });
      setPaiements((precedents) => [cree, ...precedents]);
      setModaleOuverte(false);
      setSucces(`Paiement de ${montant(cree.montant)} MAD enregistré en attente de validation.`);
    } catch (e2) {
      setErreurModale(messageErreur(e2));
    } finally {
      setAction(false);
    }
  }

  return (
    <section>
      <header className="entete-page">
        <div><h1>Paiements</h1><p className="texte-secondaire">Enregistrez les règlements affectés aux factures validées.</p></div>
        <button type="button" className="btn btn-primaire" onClick={ouvrirCreation} disabled={facturesReglables.length === 0}>
          <Icone nom="plus" taille={18} /> Enregistrer un paiement
        </button>
      </header>
      {succes && <p className="message-succes" role="status">{succes}</p>}
      <MessageErreur message={erreur} />
      {chargement ? <Chargement /> : (
        <div className="panneau">
          <div className="barre-outils"><span className="texte-secondaire">{paiements.length} paiement{paiements.length > 1 ? 's' : ''}</span><strong>Total saisi : {montant(paiements.reduce((s, p) => s + Number(p.montant), 0))} MAD</strong></div>
          <div className="defilement">
            <table className="tableau">
              <thead><tr><th>Date</th><th>Factures affectées</th><th>Mode</th><th className="num">Montant</th><th>Statut</th><th>Validé par</th></tr></thead>
              <tbody>
                {paiements.map((p) => (
                  <tr key={p.id}>
                    <td className="chiffres">{dateFr(p.datePaiement)}</td>
                    <td>{p.factures?.length ? p.factures.map((f) => `${f.numero} (${montant(f.montantAffecte)} MAD)`).join(', ') : '—'}</td>
                    <td>{MODES.find(([code]) => code === p.mode)?.[1] || p.mode}</td>
                    <td className="num chiffres"><strong>{montant(p.montant)} MAD</strong></td>
                    <td><span className={`badge ${p.valide ? 'badge-succes' : 'badge-avertissement'}`}>{p.valide ? 'Validé' : 'À valider'}</span></td>
                    <td className="texte-secondaire">{p.validePar || 'En attente'}</td>
                  </tr>
                ))}
                {paiements.length === 0 && <tr><td colSpan={6} className="texte-secondaire aucun-resultat">Aucun paiement enregistré.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modaleOuverte && (
        <div className="modale-fond" onClick={() => setModaleOuverte(false)}>
          <div className="modale-boite" onClick={(e) => e.stopPropagation()}>
            <div className="modale-entete"><h2>Enregistrer un paiement</h2><button type="button" className="bouton-icone" onClick={() => setModaleOuverte(false)}><Icone nom="croix" /></button></div>
            <form onSubmit={enregistrer}>
              <div className="modale-corps">
                <MessageErreur message={erreurModale} />
                <label className="champ"><span className="champ-label">Date du paiement</span><input type="date" className="input" required max={new Date().toLocaleDateString('sv-SE')} value={datePaiement} onChange={(e) => setDatePaiement(e.target.value)} /></label>
                <label className="champ"><span className="champ-label">Mode</span><select className="input" value={mode} onChange={(e) => setMode(e.target.value)}>{MODES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></label>
                <div className="champ">
                  <span className="champ-label">Affectation(s) aux factures</span>
                  {allocations.map((allocation, index) => {
                    const facture = factures.find((f) => String(f.id) === allocation.factureId);
                    const reste = facture ? Number(facture.montantTTC) - montantDejaAffecte(facture.id) : 0;
                    return (
                      <div className="ligne-allocation" key={index}>
                        <select className="input" aria-label={`Facture ${index + 1}`} value={allocation.factureId} onChange={(e) => modifierAllocation(index, 'factureId', e.target.value)}>
                          <option value="">Choisir une facture</option>
                          {facturesReglables.map((f) => <option key={f.id} value={f.id}>{f.numero} — {f.tiersNom} (solde {montant(Number(f.montantTTC) - montantDejaAffecte(f.id))} MAD)</option>)}
                        </select>
                        <input className="input" aria-label={`Montant affecté ${index + 1}`} type="number" min="0.01" step="0.01" max={reste || undefined} placeholder="Montant MAD" value={allocation.montantAffecte} onChange={(e) => modifierAllocation(index, 'montantAffecte', e.target.value)} />
                        {allocations.length > 1 && <button type="button" className="btn-action btn-action-supprimer" onClick={() => setAllocations((precedentes) => precedentes.filter((_, i) => i !== index))} aria-label="Retirer cette facture"><Icone nom="supprimer" taille={16} /></button>}
                      </div>
                    );
                  })}
                  <button type="button" className="btn btn-secondaire btn-petit" onClick={() => setAllocations((precedentes) => [...precedentes, { factureId: '', montantAffecte: '' }])}>Ajouter une facture</button>
                </div>
                <p className="texte-secondaire">Total du paiement : <strong>{montant(totalSaisi)} MAD</strong>. La direction devra valider ce paiement.</p>
              </div>
              <div className="modale-pied"><button type="button" className="btn btn-secondaire" onClick={() => setModaleOuverte(false)}>Annuler</button><button type="submit" className="btn btn-primaire" disabled={action || facturesReglables.length === 0}>{action ? 'Enregistrement…' : 'Enregistrer'}</button></div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
