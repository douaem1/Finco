import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listerComptes, saisirPiece } from '../services/ecritureApi';
import { listerCentres } from '../services/centreCoutApi';
import { messageErreur } from '../services/api';
import ChampSaisie from '../components/ChampSaisie';
import MessageErreur from '../components/MessageErreur';
import Chargement from '../components/Chargement';
import Balance from '../components/Balance';

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

  // Aide d'ergonomie autorisée : bouton désactivé si l'en-tête est vide.
  const incomplet = !libelle.trim() || !dateEcriture;

  if (chargement) return <Chargement texte="Chargement du plan comptable…" />;

  return (
    <section>
      <Link to="/pieces" className="lien-retour">Retour au journal</Link>
      <header className="entete-page">
        <div>
          <p className="fil">Comptabilité financière</p>
          <h1>Nouvelle écriture</h1>
          <p className="texte-secondaire">Le numéro de pièce est attribué par le serveur à l’enregistrement.</p>
        </div>
      </header>

      <MessageErreur message={erreur} onFermer={() => setErreur('')} />

      <form onSubmit={enregistrer} className="pile-large">
        <div className="panneau grille-entete">
          <ChampSaisie id="date" label="Date d’écriture" type="date"
            value={dateEcriture} onChange={(e) => setDateEcriture(e.target.value)} />
          <ChampSaisie id="libelle" label="Libellé" maxLength={255}
            value={libelle} onChange={(e) => setLibelle(e.target.value)}
            placeholder="Facture Cabinet Audit F-1005" />
        </div>

        <div className="panneau panneau-tableau">
          <table className="tableau tableau-saisie">
            <thead>
              <tr>
                <th className="col-index">N°</th><th>Compte</th><th>Centre de coûts</th><th>Sens</th>
                <th className="num">Montant (MAD)</th><th><span className="visuellement-cache">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l, i) => (
                <tr key={l.cle}>
                  <td className="col-index texte-secondaire">{i + 1}</td>
                  <td>
                    <select className="input" value={l.compteId} aria-label={`Compte, ligne ${i + 1}`}
                      onChange={(e) => modifierLigne(l.cle, 'compteId', e.target.value)}>
                      <option value="">Choisir un compte</option>
                      {comptes.map((c) => <option key={c.id} value={c.id}>{c.numero} {c.libelle}</option>)}
                    </select>
                  </td>
                  <td>
                    <select className="input" value={l.centreCoutId} aria-label={`Centre de coûts, ligne ${i + 1}`}
                      onChange={(e) => modifierLigne(l.cle, 'centreCoutId', e.target.value)}>
                      <option value="">Aucun</option>
                      {centres.map((c) => <option key={c.id} value={c.id}>{c.code} {c.libelle}</option>)}
                    </select>
                  </td>
                  <td>
                    <div className="bascule" role="group" aria-label={`Sens, ligne ${i + 1}`}>
                      {['DEBIT', 'CREDIT'].map((s) => (
                        <button key={s} type="button" className={l.sens === s ? 'actif' : ''} aria-pressed={l.sens === s}
                          onClick={() => modifierLigne(l.cle, 'sens', s)}>
                          {s === 'DEBIT' ? 'Débit' : 'Crédit'}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td>
                    <input className="input num chiffres" type="number" step="0.01" inputMode="decimal"
                      value={l.montant} placeholder="0,00" aria-label={`Montant, ligne ${i + 1}`}
                      onChange={(e) => modifierLigne(l.cle, 'montant', e.target.value)} />
                  </td>
                  <td>
                    <button type="button" className="bouton-icone" title="Retirer la ligne" aria-label={`Retirer la ligne ${i + 1}`}
                      onClick={() => retirerLigne(l.cle)} disabled={lignes.length <= 1}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="ajout-ligne">
            <button type="button" className="bouton-texte" onClick={ajouterLigne}>+ Ajouter une ligne</button>
          </div>
        </div>

        <div className="pied-saisie">
          {/* Aide visuelle : la balance suit les montants saisis. Le serveur reste seul juge. */}
          <Balance debit={totalDebit} credit={totalCredit} compacte />
          <div className="actions">
            <Link to="/pieces" className="btn btn-secondaire">Annuler</Link>
            <button type="submit" className="btn btn-primaire" disabled={incomplet || envoi}>
              {envoi ? 'Enregistrement…' : 'Enregistrer l’écriture'}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
