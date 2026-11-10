import { useEffect, useMemo, useState } from 'react';
import {
  creerFacture, listerFactures, modifierFacture, supprimerFacture, validerFacture,
} from '../services/factureApi';
import { listerFournisseurs, listerClients } from '../services/tiersApi';
import { listerCentres } from '../services/centreCoutApi';
import { erreursParChamp, messageErreur } from '../services/api';
import { dateFr, montant } from '../utils/format';
import MessageErreur from '../components/MessageErreur';
import Chargement from '../components/Chargement';
import Icone from '../components/Icone';

function aujourdhui() {
  return new Date().toLocaleDateString('sv-SE');
}

function libelleStatut(statut) {
  if (statut === 'PAYEE') return ['Payée', 'badge-succes'];
  if (statut === 'VALIDEE') return ['Validée', 'badge-principal'];
  return ['Brouillon', 'badge-avertissement'];
}

export default function Factures() {
  const [factures, setFactures] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [clients, setClients] = useState([]);
  const [centres, setCentres] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [action, setAction] = useState(false);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
  const [recherche, setRecherche] = useState('');
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [factureEnCours, setFactureEnCours] = useState(null);
  const [formulaire, setFormulaire] = useState({
    type: 'ACHAT', numero: '', dateFacture: aujourdhui(), montantHT: '', tauxTVA: '20', tiersId: '',
  });
  const [factureAValider, setFactureAValider] = useState(null);
  const [centreCoutId, setCentreCoutId] = useState('');
  const [factureASupprimer, setFactureASupprimer] = useState(null);
  const [erreurModale, setErreurModale] = useState('');

  useEffect(() => {
    Promise.all([listerFactures(), listerFournisseurs(), listerClients(), listerCentres()])
      .then(([f, fournisseursRecus, clientsRecus, centresRecus]) => {
        setFactures(f);
        setFournisseurs(fournisseursRecus);
        setClients(clientsRecus);
        setCentres(centresRecus);
      })
      .catch((e) => setErreur(messageErreur(e)))
      .finally(() => setChargement(false));
  }, []);

  const tiers = formulaire.type === 'ACHAT' ? fournisseurs : clients;
  const facturesVisibles = useMemo(() => {
    const filtre = recherche.trim().toLowerCase();
    return factures.filter((f) => !filtre
      || f.numero.toLowerCase().includes(filtre)
      || f.tiersNom.toLowerCase().includes(filtre)
      || f.type.toLowerCase().includes(filtre));
  }, [factures, recherche]);

  function ouvrirCreation() {
    setFactureEnCours(null);
    setFormulaire({ type: 'ACHAT', numero: '', dateFacture: aujourdhui(), montantHT: '', tauxTVA: '20', tiersId: '' });
    setErreurModale('');
    setFormulaireOuvert(true);
  }

  function ouvrirModification(facture) {
    setFactureEnCours(facture);
    setFormulaire({
      type: facture.type,
      numero: facture.numero,
      dateFacture: facture.dateFacture,
      montantHT: String(facture.montantHT),
      tauxTVA: String(facture.tauxTVA),
      tiersId: String(facture.tiersId),
    });
    setErreurModale('');
    setFormulaireOuvert(true);
  }

  async function enregistrer(e) {
    e.preventDefault();
    const ht = Number(formulaire.montantHT);
    const tva = Number(formulaire.tauxTVA);
    if (!formulaire.numero.trim() || !formulaire.dateFacture || !formulaire.tiersId
      || !Number.isFinite(ht) || ht <= 0 || !Number.isFinite(tva) || tva < 0 || tva > 100) {
      setErreurModale('Complétez les champs requis avec un montant HT positif et un taux de TVA entre 0 et 100.');
      return;
    }
    setAction(true);
    setErreurModale('');
    try {
      const payload = {
        numero: formulaire.numero.trim(),
        dateFacture: formulaire.dateFacture,
        type: formulaire.type,
        montantHT: ht,
        tauxTVA: tva,
        tiersId: Number(formulaire.tiersId),
      };
      if (factureEnCours) {
        const maj = await modifierFacture(factureEnCours.id, payload);
        setFactures((precedentes) => precedentes.map((f) => f.id === maj.id ? maj : f));
        setSucces(`Facture ${maj.numero} mise à jour.`);
      } else {
        const cree = await creerFacture(payload);
        setFactures((precedentes) => [cree, ...precedentes]);
        setSucces(`Facture ${cree.numero} créée en brouillon.`);
      }
      setFormulaireOuvert(false);
    } catch (e2) {
      const champs = erreursParChamp(e2);
      setErreurModale(Object.values(champs)[0] || messageErreur(e2));
    } finally {
      setAction(false);
    }
  }

  async function confirmerValidation(e) {
    e.preventDefault();
    setAction(true);
    setErreurModale('');
    try {
      const maj = await validerFacture(factureAValider.id, {
        centreCoutId: factureAValider.type === 'ACHAT' ? Number(centreCoutId) : null,
      });
      setFactures((precedentes) => precedentes.map((f) => f.id === maj.id ? maj : f));
      setFactureAValider(null);
      setSucces(`Facture ${maj.numero} validée et comptabilisée${maj.pieceNumero ? ` (${maj.pieceNumero})` : ''}.`);
    } catch (e) {
      setErreurModale(messageErreur(e));
    } finally {
      setAction(false);
    }
  }

  async function confirmerSuppression() {
    if (!factureASupprimer) return;
    setAction(true);
    try {
      await supprimerFacture(factureASupprimer.id);
      setFactures((precedentes) => precedentes.filter((f) => f.id !== factureASupprimer.id));
      setSucces(`Facture ${factureASupprimer.numero} supprimée.`);
      setFactureASupprimer(null);
    } catch (e) {
      setErreur(messageErreur(e));
      setFactureASupprimer(null);
    } finally {
      setAction(false);
    }
  }

  return (
    <section>
      <header className="entete-page">
        <div>
          <h1>Factures</h1>
          <p className="texte-secondaire">Saisissez les factures d’achat et de vente, puis comptabilisez-les.</p>
        </div>
        <button type="button" className="btn btn-primaire" onClick={ouvrirCreation}>
          <Icone nom="plus" taille={18} /> Nouvelle facture
        </button>
      </header>

      {succes && <p className="message-succes" role="status">{succes}</p>}
      <MessageErreur message={erreur} />
      {chargement ? <Chargement /> : (
        <div className="panneau">
          <div className="barre-outils">
            <label className="recherche">
              <Icone nom="recherche" taille={18} />
              <input type="search" value={recherche} onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher une facture, un tiers…" aria-label="Rechercher une facture" />
            </label>
            <span className="texte-secondaire">{facturesVisibles.length} facture{facturesVisibles.length > 1 ? 's' : ''}</span>
          </div>
          <div className="defilement">
            <table className="tableau">
              <thead><tr><th>Numéro</th><th>Date</th><th>Type</th><th>Tiers</th><th className="num">HT</th><th className="num">TTC</th><th>Statut</th><th>Actions</th></tr></thead>
              <tbody>
                {facturesVisibles.map((facture) => {
                  const [statut, classe] = libelleStatut(facture.statut);
                  return (
                    <tr key={facture.id}>
                      <td><strong>{facture.numero}</strong></td>
                      <td className="chiffres">{dateFr(facture.dateFacture)}</td>
                      <td>{facture.type === 'ACHAT' ? 'Achat' : 'Vente'}</td>
                      <td>{facture.tiersNom}</td>
                      <td className="num chiffres">{montant(facture.montantHT)} MAD</td>
                      <td className="num chiffres"><strong>{montant(facture.montantTTC)} MAD</strong></td>
                      <td><span className={`badge ${classe}`}>{statut}</span></td>
                      <td>
                        {facture.statut === 'BROUILLON' ? (
                          <div className="actions-cell">
                            <button type="button" className="btn-action" onClick={() => ouvrirModification(facture)} title="Modifier"><Icone nom="editer" taille={16} /></button>
                            <button type="button" className="btn-action" onClick={() => { setFactureAValider(facture); setCentreCoutId(''); setErreurModale(''); }} title="Comptabiliser"><Icone nom="valide" taille={16} /></button>
                            <button type="button" className="btn-action btn-action-supprimer" onClick={() => setFactureASupprimer(facture)} title="Supprimer"><Icone nom="supprimer" taille={16} /></button>
                          </div>
                        ) : <span className="texte-secondaire">{facture.pieceNumero || 'Comptabilisée'}</span>}
                      </td>
                    </tr>
                  );
                })}
                {facturesVisibles.length === 0 && <tr><td colSpan={8} className="texte-secondaire aucun-resultat">Aucune facture à afficher.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {formulaireOuvert && (
        <div className="modale-fond" onClick={() => setFormulaireOuvert(false)}>
          <div className="modale-boite" onClick={(e) => e.stopPropagation()}>
            <div className="modale-entete"><h2>{factureEnCours ? 'Modifier la facture' : 'Nouvelle facture'}</h2><button type="button" className="bouton-icone" onClick={() => setFormulaireOuvert(false)}><Icone nom="croix" /></button></div>
            <form onSubmit={enregistrer}>
              <div className="modale-corps">
                <MessageErreur message={erreurModale} />
                <label className="champ"><span className="champ-label">Type de facture</span>
                  <select className="input" value={formulaire.type} disabled={Boolean(factureEnCours)} onChange={(e) => setFormulaire({ ...formulaire, type: e.target.value, tiersId: '' })}>
                    <option value="ACHAT">Achat fournisseur</option><option value="VENTE">Vente client</option>
                  </select>
                </label>
                <label className="champ"><span className="champ-label">Numéro</span><input className="input" maxLength={30} required value={formulaire.numero} onChange={(e) => setFormulaire({ ...formulaire, numero: e.target.value })} /></label>
                <label className="champ"><span className="champ-label">Date de facture</span><input className="input" type="date" required max={aujourdhui()} value={formulaire.dateFacture} onChange={(e) => setFormulaire({ ...formulaire, dateFacture: e.target.value })} /></label>
                <label className="champ"><span className="champ-label">{formulaire.type === 'ACHAT' ? 'Fournisseur' : 'Client'}</span>
                  <select className="input" required value={formulaire.tiersId} onChange={(e) => setFormulaire({ ...formulaire, tiersId: e.target.value })}>
                    <option value="">Sélectionner un tiers</option>{tiers.map((t) => <option key={t.id} value={t.id}>{t.nom}</option>)}
                  </select>
                  {tiers.length === 0 && <span className="champ-aide">Créez d’abord un {formulaire.type === 'ACHAT' ? 'fournisseur' : 'client'} dans l’espace Tiers.</span>}
                </label>
                <div className="grille-formulaire">
                  <label className="champ"><span className="champ-label">Montant HT (MAD)</span><input className="input" type="number" min="0.01" step="0.01" required value={formulaire.montantHT} onChange={(e) => setFormulaire({ ...formulaire, montantHT: e.target.value })} /></label>
                  <label className="champ"><span className="champ-label">TVA (%)</span><input className="input" type="number" min="0" max="100" step="0.01" required value={formulaire.tauxTVA} onChange={(e) => setFormulaire({ ...formulaire, tauxTVA: e.target.value })} /></label>
                </div>
              </div>
              <div className="modale-pied"><button type="button" className="btn btn-secondaire" onClick={() => setFormulaireOuvert(false)}>Annuler</button><button type="submit" className="btn btn-primaire" disabled={action || tiers.length === 0}>{action ? 'Enregistrement…' : 'Enregistrer'}</button></div>
            </form>
          </div>
        </div>
      )}

      {factureAValider && (
        <div className="modale-fond" onClick={() => setFactureAValider(null)}>
          <div className="modale-boite" onClick={(e) => e.stopPropagation()}>
            <div className="modale-entete"><h2>Comptabiliser la facture</h2><button type="button" className="bouton-icone" onClick={() => setFactureAValider(null)}><Icone nom="croix" /></button></div>
            <form onSubmit={confirmerValidation}>
              <div className="modale-corps">
                <MessageErreur message={erreurModale} />
                <p>La validation crée et valide une pièce comptable pour <strong>{factureAValider.numero}</strong> ({montant(factureAValider.montantTTC)} MAD TTC).</p>
                {factureAValider.type === 'ACHAT' && (
                  <label className="champ"><span className="champ-label">Centre de coûts</span>
                    <select className="input" required value={centreCoutId} onChange={(e) => setCentreCoutId(e.target.value)}>
                      <option value="">Sélectionner un centre</option>{centres.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.libelle}</option>)}
                    </select>
                  </label>
                )}
              </div>
              <div className="modale-pied"><button type="button" className="btn btn-secondaire" onClick={() => setFactureAValider(null)}>Annuler</button><button type="submit" className="btn btn-primaire" disabled={action || (factureAValider.type === 'ACHAT' && centres.length === 0)}>{action ? 'Validation…' : 'Valider et comptabiliser'}</button></div>
            </form>
          </div>
        </div>
      )}

      {factureASupprimer && (
        <div className="modale-fond" onClick={() => setFactureASupprimer(null)}>
          <div className="modale-boite" onClick={(e) => e.stopPropagation()}>
            <div className="modale-entete"><h2>Supprimer la facture</h2><button type="button" className="bouton-icone" onClick={() => setFactureASupprimer(null)}><Icone nom="croix" /></button></div>
            <div className="modale-corps"><p>Supprimer le brouillon <strong>{factureASupprimer.numero}</strong> ? Cette action est irréversible.</p></div>
            <div className="modale-pied"><button type="button" className="btn btn-secondaire" onClick={() => setFactureASupprimer(null)}>Annuler</button><button type="button" className="btn btn-primaire" onClick={confirmerSuppression} disabled={action}>{action ? 'Suppression…' : 'Supprimer'}</button></div>
          </div>
        </div>
      )}
    </section>
  );
}
