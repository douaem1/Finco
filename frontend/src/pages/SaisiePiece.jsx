import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listerComptes, saisirPiece } from '../services/ecritureApi';
import { listerCentres } from '../services/centreCoutApi';
import { listerExercices } from '../services/exerciceApi';
import { erreursParChamp, messageErreur } from '../services/api';
import { formatMAD } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import AsyncState from '../components/ui/AsyncState';
import Field from '../components/ui/Field';
import Combobox from '../components/ui/Combobox';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Amount from '../components/ui/Amount';
import MessageErreur from '../components/MessageErreur';
import { useToast } from '../components/ui/ToastRegion';

/* ============================================================
   Saisie d'une écriture comptable.
   React COLLECTE les données et les ENVOIE : il ne bloque aucune
   règle (équilibre, centre obligatoire en classe 6...). C'est le
   serveur qui décide, et on affiche son message en cas de refus.
   Seules des aides de saisie sont faites ici : date max = aujourd'hui,
   centre de coûts grisé pour les comptes de bilan (classes 1 à 5),
   barre d'équilibre en direct, lecture seule si l'exercice est clôturé.
   ============================================================ */

let compteurLignes = 0;
const nouvelleLigne = (sens = 'DEBIT') => ({ cle: ++compteurLignes, compteId: '', centreCoutId: '', sens, montant: '' });
const aujourdhui = () => new Date().toLocaleDateString('sv-SE'); // AAAA-MM-JJ, heure locale

export default function SaisiePiece() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [comptes, setComptes] = useState([]);
  const [centres, setCentres] = useState([]);
  const [exercices, setExercices] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreurChargement, setErreurChargement] = useState('');

  const [dateEcriture, setDateEcriture] = useState(aujourdhui());
  const [libelle, setLibelle] = useState('');
  const [lignes, setLignes] = useState(() => [nouvelleLigne('DEBIT'), nouvelleLigne('CREDIT')]);

  const [erreur, setErreur] = useState('');
  const [champs, setChamps] = useState({}); // erreurs par champ renvoyées par le serveur
  const [envoi, setEnvoi] = useState(false);
  const [confirmationOuverte, setConfirmationOuverte] = useState(false);

  function charger() {
    setChargement(true);
    setErreurChargement('');
    Promise.all([listerComptes(), listerCentres(), listerExercices().catch(() => [])])
      .then(([c, cc, ex]) => { setComptes(c); setCentres(cc); setExercices(ex); })
      .catch((e) => setErreurChargement(messageErreur(e)))
      .finally(() => setChargement(false));
  }
  useEffect(charger, []);

  const optionsComptes = useMemo(() => comptes.map((c) => ({ value: String(c.id), label: `${c.numero} ${c.libelle}` })), [comptes]);
  const optionsCentres = useMemo(() => centres.map((c) => ({ value: String(c.id), label: `${c.code} ${c.libelle}` })), [centres]);

  // Lecture seule : la date saisie appartient à un exercice clôturé.
  const exerciceCourant = exercices.find((e) => e.dateDebut <= dateEcriture && e.dateFin >= dateEcriture);
  const lectureSeule = Boolean(exerciceCourant?.cloture);

  const classeDuCompte = (compteId) => comptes.find((c) => String(c.id) === String(compteId))?.classe;
  // Un centre de coûts ne s'impute que sur un compte de gestion : charges (6, obligatoire) ou produits (7).
  const centreApplicable = (compteId) => !compteId || [6, 7].includes(classeDuCompte(compteId));

  function modifierLigne(cle, champ, valeur) {
    setLignes((ls) => ls.map((l) => {
      if (l.cle !== cle) return l;
      const ligne = { ...l, [champ]: valeur };
      if (champ === 'compteId' && !centreApplicable(valeur)) ligne.centreCoutId = '';
      return ligne;
    }));
  }
  const ajouterLigne = () => setLignes((ls) => [...ls, nouvelleLigne()]);
  const retirerLigne = (cle) => setLignes((ls) => ls.filter((l) => l.cle !== cle));

  // Aide visuelle uniquement (comme une calculatrice) : n'empêche pas le serveur de juger.
  const somme = (sens) => lignes.filter((l) => l.sens === sens).reduce((t, l) => t + (Number(l.montant) || 0), 0);
  const totalDebit = somme('DEBIT');
  const totalCredit = somme('CREDIT');
  const ecart = Math.abs(totalDebit - totalCredit);
  const equilibre = totalDebit > 0 && ecart < 0.005;

  const incomplet = !libelle.trim() || !dateEcriture;

  function demanderValidation(e) {
    e.preventDefault();
    setErreur('');
    setChamps({});
    setConfirmationOuverte(true);
  }

  async function enregistrer() {
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
      setConfirmationOuverte(false);
      showToast(`Écriture ${piece.numero} enregistrée.`);
      navigate(`/pieces/${piece.id}`, { state: { succes: `Écriture ${piece.numero} enregistrée.` } });
    } catch (err) {
      setConfirmationOuverte(false);
      setErreur(messageErreur(err)); // message du serveur, ex. « Écriture déséquilibrée : ... »
      setChamps(erreursParChamp(err)); // ex. { "lignes.1.centreCoutId": "..." }
      showToast(messageErreur(err), 'error');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <section>
      <Link to="/pieces" className="lien-retour">Retour au journal</Link>
      <PageHeader
        title="Nouvelle écriture"
        description="Le numéro de pièce est attribué par le serveur à l’enregistrement."
      />

      <AsyncState
        loading={chargement}
        error={erreurChargement}
        onRetry={charger}
        empty={false}
      >
        {lectureSeule && (
          <div className="bandeau-verrou" id="verrou-etat" role="status">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <rect x="4" y="10.5" width="16" height="10" rx="2" />
              <path d="M8 10.5V7a4 4 0 018 0v3.5" />
            </svg>
            Exercice clôturé : la saisie est en lecture seule.
          </div>
        )}

        <MessageErreur message={erreur} onFermer={() => setErreur('')} />

        <form onSubmit={demanderValidation} className="pile-large" aria-describedby={lectureSeule ? 'verrou-etat' : undefined}>
          <div className="panneau grille-entete">
            <Field id="date" label="Date d’écriture" required hint="Dans un exercice ouvert, au plus tard aujourd’hui." error={champs.dateEcriture}>
              {(p) => (
                <input className="input" type="date" max={aujourdhui()} value={dateEcriture}
                  disabled={lectureSeule} onChange={(e) => setDateEcriture(e.target.value)} {...p} />
              )}
            </Field>
            <Field id="libelle" label="Libellé" required hint="255 caractères maximum." error={champs.libelle}>
              {(p) => (
                <input className="input" maxLength={255} placeholder="Facture Cabinet Audit F-1005" value={libelle}
                  disabled={lectureSeule} onChange={(e) => setLibelle(e.target.value)} {...p} />
              )}
            </Field>
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
                {lignes.map((l, i) => {
                  const err = (c) => champs[`lignes.${i + 1}.${c}`];
                  const classe = classeDuCompte(l.compteId);
                  const applicable = centreApplicable(l.compteId);
                  return (
                    <tr key={l.cle} className={Object.keys(champs).some((k) => k.startsWith(`lignes.${i + 1}.`)) ? 'ligne-en-erreur' : ''}>
                      <td className="col-index texte-secondaire">{i + 1}</td>
                      <td>
                        <Combobox
                          id={`compte-${l.cle}`}
                          options={optionsComptes}
                          value={l.compteId}
                          onChange={(v) => modifierLigne(l.cle, 'compteId', v)}
                          placeholder={`Compte, ligne ${i + 1}`}
                          disabled={lectureSeule}
                          error={err('compteId')}
                        />
                      </td>
                      <td>
                        <Combobox
                          id={`centre-${l.cle}`}
                          options={optionsCentres}
                          value={l.centreCoutId}
                          onChange={(v) => modifierLigne(l.cle, 'centreCoutId', v)}
                          placeholder={!applicable ? 'Non applicable' : classe === 6 ? 'Obligatoire — choisir' : 'Aucun'}
                          vide={applicable ? 'Aucun' : 'Non applicable'}
                          disabled={!applicable || lectureSeule}
                          required={classe === 6}
                          error={err('centreCoutId')}
                        />
                      </td>
                      <td>
                        <div className="bascule" role="group" aria-label={`Sens, ligne ${i + 1}`}>
                          {['DEBIT', 'CREDIT'].map((s) => (
                            <button key={s} type="button" className={l.sens === s ? 'actif' : ''} aria-pressed={l.sens === s}
                              disabled={lectureSeule} onClick={() => modifierLigne(l.cle, 'sens', s)}>
                              {s === 'DEBIT' ? 'Débit' : 'Crédit'}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td>
                        <input className={`input num chiffres ${err('montant') ? 'input-erreur' : ''}`} type="number" step="0.01" min="0.01" inputMode="decimal"
                          title={err('montant') || undefined}
                          value={l.montant} placeholder="0,00" aria-label={`Montant, ligne ${i + 1}`}
                          disabled={lectureSeule}
                          onChange={(e) => modifierLigne(l.cle, 'montant', e.target.value)} />
                      </td>
                      <td>
                        <button type="button" className="bouton-icone" title="Retirer la ligne" aria-label={`Retirer la ligne ${i + 1}`}
                          onClick={() => retirerLigne(l.cle)} disabled={lectureSeule || lignes.length <= 1}>×</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="ajout-ligne">
              <button type="button" className="bouton-texte" onClick={ajouterLigne} disabled={lectureSeule}>+ Ajouter une ligne</button>
              <span className="champ-aide">
                Au moins un débit et un crédit · montants &gt; 0 avec 2 décimales max · centre de coûts obligatoire
                en classe 6, possible en classe 7, non applicable aux comptes de bilan (classes 1 à 5).
              </span>
            </div>
          </div>

          <div className={`barre-equilibre ${equilibre ? 'est-equilibre' : 'est-ecart'}`}>
            <div className="barre-equilibre-totaux">
              <span><small>Total débit</small><Amount value={totalDebit} /></span>
              <span><small>Total crédit</small><Amount value={totalCredit} /></span>
              <span><small>Écart</small><Amount value={ecart} /></span>
            </div>
            <p className="barre-equilibre-etat" role="status">
              {equilibre ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 10.5l4 4 8-9" />
                  </svg>
                  Écriture équilibrée
                </>
              ) : (
                <>Écart de {formatMAD(ecart)} — l’écriture doit être équilibrée pour être enregistrée.</>
              )}
            </p>
            <div className="actions">
              <Link to="/pieces" className="btn btn-secondaire">Annuler</Link>
              <Button type="submit" variant="primary" disabled={incomplet || !equilibre || lectureSeule || envoi}>
                {envoi ? 'Enregistrement…' : 'Valider l’écriture'}
              </Button>
            </div>
          </div>
        </form>
      </AsyncState>

      <ConfirmDialog
        open={confirmationOuverte}
        onOpenChange={setConfirmationOuverte}
        title="Enregistrer l’écriture ?"
        description={`Une pièce sera créée pour un total de ${formatMAD(totalDebit)}. Le numéro sera attribué par le serveur.`}
        confirmLabel="Enregistrer"
        loading={envoi}
        onConfirm={enregistrer}
      />
    </section>
  );
}
