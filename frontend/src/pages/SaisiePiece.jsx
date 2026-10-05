import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listerComptes, saisirPiece } from '../services/ecritureApi';
import { listerCentres } from '../services/centreCoutApi';
import { messageErreur } from '../services/api';
import { montant } from '../utils/format';
import ChampSaisie from '../components/ChampSaisie';
import MessageErreur from '../components/MessageErreur';
import Chargement from '../components/Chargement';

/* ============================================================
   Saisie d'une écriture comptable.
   React COLLECTE les données et les ENVOIE : il ne vérifie aucune
   règle (équilibre, centre obligatoire en classe 6...). C'est le
   serveur qui décide, et on affiche son message en cas de refus.
   ============================================================ */

let compteurLignes = 0;
const nouvelleLigne = (sens = 'DEBIT') => ({ cle: ++compteurLignes, compteId: '', centreCoutId: '', sens, montant: '' });
const aujourdhui = () => new Date().toLocaleDateString('sv-SE'); // AAAA-MM-JJ, heure locale

export default function SaisiePiece() {
  const navigate = useNavigate();

  const [comptes, setComptes] = useState([]);
  const [centres, setCentres] = useState([]);
  const [chargement, setChargement] = useState(true);

  const [dateEcriture, setDateEcriture] = useState(aujourdhui());
  const [libelle, setLibelle] = useState('');
  const [lignes, setLignes] = useState(() => [nouvelleLigne('DEBIT'), nouvelleLigne('CREDIT')]);

  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    Promise.all([listerComptes(), listerCentres()])
      .then(([c, cc]) => { setComptes(c); setCentres(cc); })
      .catch((e) => setErreur(messageErreur(e)))
      .finally(() => setChargement(false));
  }, []);

  function modifierLigne(cle, champ, valeur) {
    setLignes((ls) => ls.map((l) => (l.cle === cle ? { ...l, [champ]: valeur } : l)));
  }
  const ajouterLigne = () => setLignes((ls) => [...ls, nouvelleLigne()]);
  const retirerLigne = (cle) => setLignes((ls) => ls.filter((l) => l.cle !== cle));

  async function enregistrer(e) {
    e.preventDefault();
    setErreur('');
    setEnvoi(true);
    try {
      const piece = await saisirPiece({
        dateEcriture,
        libelle,
        lignes: lignes.map((l) => ({
          compteId: l.compteId ? Number(l.compteId) : null,
          centreCoutId: l.centreCoutId ? Number(l.centreCoutId) : null,
          sens: l.sens,
          montant: l.montant === '' ? null : l.montant,
        })),
      });
      navigate(`/pieces/${piece.id}`, { state: { succes: `Écriture ${piece.numero} enregistrée.` } });
    } catch (err) {
      setErreur(messageErreur(err)); // message du serveur, ex. « Écriture déséquilibrée : ... »
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setEnvoi(false);
    }
  }

  // Aide visuelle uniquement (comme une calculatrice) : n'empêche PAS l'envoi.
  const somme = (sens) => lignes.filter((l) => l.sens === sens).reduce((t, l) => t + (Number(l.montant) || 0), 0);
  const totalDebit = somme('DEBIT');
  const totalCredit = somme('CREDIT');
  const ecart = Math.round((totalDebit - totalCredit) * 100) / 100;

  // Aide d'ergonomie autorisée : bouton désactivé si l'en-tête est vide.
  const incomplet = !libelle.trim() || !dateEcriture;

  if (chargement) return <Chargement texte="Chargement du plan comptable…" />;

  return (
    <section>
      <div className="f-titre-page">
        <div>
          <Link to="/pieces" className="f-lien f-retour">← Journal</Link>
          <h1>Nouvelle <span className="f-surligne">écriture</span></h1>
        </div>
      </div>

      <MessageErreur message={erreur} onFermer={() => setErreur('')} />

      <form onSubmit={enregistrer} className="f-pile-large">
        <div className="f-papier f-entete-piece">
          <span className="f-perfos" aria-hidden="true"><i /><i /><i /></span>
          <ChampSaisie id="date" label="Date d'écriture" type="date"
            value={dateEcriture} onChange={(e) => setDateEcriture(e.target.value)} />
          <ChampSaisie id="libelle" label="Libellé" maxLength={255}
            value={libelle} onChange={(e) => setLibelle(e.target.value)}
            placeholder="ex. Facture Cabinet Audit F-1005" />
          <div className="f-numero-auto">
            <span className="f-champ-label">N° de pièce</span>
            <span className="f-numero-fantome">PC-AAAA-•••••</span>
            <span className="f-champ-aide">attribué par le serveur</span>
          </div>
        </div>

        <div className="f-papier f-tableau-cadre">
          <table className="f-tableau f-tableau-saisie">
            <thead>
              <tr>
                <th>#</th><th>Compte</th><th>Centre de coûts</th><th>Sens</th>
                <th className="f-num">Montant (MAD)</th><th />
              </tr>
            </thead>
            <tbody>
              {lignes.map((l, i) => (
                <tr key={l.cle}>
                  <td className="f-muet">{i + 1}</td>
                  <td>
                    <select className="f-input" value={l.compteId} aria-label={`Compte ligne ${i + 1}`}
                      onChange={(e) => modifierLigne(l.cle, 'compteId', e.target.value)}>
                      <option value="">— choisir un compte —</option>
                      {comptes.map((c) => <option key={c.id} value={c.id}>{c.numero} · {c.libelle}</option>)}
                    </select>
                  </td>
                  <td>
                    <select className="f-input" value={l.centreCoutId} aria-label={`Centre de coûts ligne ${i + 1}`}
                      onChange={(e) => modifierLigne(l.cle, 'centreCoutId', e.target.value)}>
                      <option value="">— aucun —</option>
                      {centres.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.libelle}</option>)}
                    </select>
                  </td>
                  <td>
                    <div className="f-bascule" role="group" aria-label={`Sens ligne ${i + 1}`}>
                      {['DEBIT', 'CREDIT'].map((s) => (
                        <button key={s} type="button" className={l.sens === s ? 'actif' : ''}
                          onClick={() => modifierLigne(l.cle, 'sens', s)}>
                          {s === 'DEBIT' ? 'Débit' : 'Crédit'}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td>
                    <input className="f-input f-num f-mono" type="number" step="0.01" inputMode="decimal"
                      value={l.montant} placeholder="0,00" aria-label={`Montant ligne ${i + 1}`}
                      onChange={(e) => modifierLigne(l.cle, 'montant', e.target.value)} />
                  </td>
                  <td>
                    <button type="button" className="f-icone-btn" title="Retirer la ligne"
                      onClick={() => retirerLigne(l.cle)} disabled={lignes.length <= 1}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={6}>
                  <button type="button" className="f-btn f-btn-petit" onClick={ajouterLigne}>+ Ajouter une ligne</button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="f-bas-saisie">
          <div className="f-totaux">
            <div><span>Total débit</span><b className="f-mono">{montant(totalDebit)}</b></div>
            <div><span>Total crédit</span><b className="f-mono">{montant(totalCredit)}</b></div>
            <div className={ecart === 0 ? 'f-ecart-nul' : 'f-ecart'}>
              <span>Écart</span><b className="f-mono">{montant(Math.abs(ecart))}</b>
            </div>
          </div>
          <div className="f-actions">
            <Link to="/pieces" className="f-btn">Annuler</Link>
            <button type="submit" className="f-btn f-btn-noir" disabled={incomplet || envoi}>
              {envoi ? 'Enregistrement…' : 'Enregistrer l’écriture'}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
