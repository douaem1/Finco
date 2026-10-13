import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  listerBudgets, creerBudget, modifierBudget, supprimerBudget,
} from '../services/budgetApi';
import { listerCentres } from '../services/centreCoutApi';
import { erreursParChamp, messageErreur } from '../services/api';
import { montant } from '../utils/format';
import MessageErreur from '../components/MessageErreur';
import Chargement from '../components/Chargement';
import Icone from '../components/Icone';

const ANNEE_COURANTE = new Date().getFullYear();

export default function Budgets() {
  const { utilisateur } = useAuth();

  const [budgets, setBudgets] = useState([]);
  const [centres, setCentres] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
  const [recherche, setRecherche] = useState('');
  const [filtreAnnee, setFiltreAnnee] = useState('');

  // Modale création / modification
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [elementEnCours, setElementEnCours] = useState(null);
  const [formulaire, setFormulaire] = useState({
    annee: String(ANNEE_COURANTE),
    montantPrevu: '',
    centreCoutId: '',
  });
  const [erreursChamps, setErreursChamps] = useState({});
  const [erreurModale, setErreurModale] = useState('');
  const [chargementAction, setChargementAction] = useState(false);

  // Modale suppression
  const [elementASupprimer, setElementASupprimer] = useState(null);

  const peutModifier = utilisateur?.role === 'CONTROLEUR';

  useEffect(() => { chargerDonnees(); }, []);

  async function chargerDonnees() {
    setChargement(true);
    setErreur('');
    try {
      const [b, c] = await Promise.all([listerBudgets(), listerCentres()]);
      setBudgets(b);
      setCentres(c);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setChargement(false);
    }
  }

  function ouvrirCreation() {
    setElementEnCours(null);
    setFormulaire({
      annee: String(ANNEE_COURANTE),
      montantPrevu: '',
      centreCoutId: centres.length > 0 ? String(centres[0].id) : '',
    });
    setErreursChamps({});
    setErreurModale('');
    setModaleOuverte(true);
  }

  function ouvrirModification(budget) {
    setElementEnCours(budget);
    setFormulaire({
      annee: String(budget.annee),
      montantPrevu: String(budget.montantPrevu),
      centreCoutId: String(budget.centreCoutId),
    });
    setErreursChamps({});
    setErreurModale('');
    setModaleOuverte(true);
  }

  function validerFormulaire() {
    const errs = {};
    const annee = Number(formulaire.annee);
    if (!formulaire.annee || isNaN(annee) || annee < 2000 || annee > 2099) {
      errs.annee = 'L\'année doit être comprise entre 2000 et 2099.';
    }
    const montantVal = Number(formulaire.montantPrevu);
    if (!formulaire.montantPrevu || isNaN(montantVal) || montantVal < 0) {
      errs.montantPrevu = 'Le montant prévu doit être supérieur ou égal à zéro.';
    } else if (!/^\d+([.,]\d{1,2})?$/.test(String(formulaire.montantPrevu).trim())) {
      errs.montantPrevu = 'Le montant prévu ne peut pas avoir plus de 2 décimales.';
    }
    if (!formulaire.centreCoutId) {
      errs.centreCoutId = 'Le centre de coûts est obligatoire.';
    }
    setErreursChamps(errs);
    return Object.keys(errs).length === 0;
  }

  async function enregistrer(e) {
    e.preventDefault();
    if (!validerFormulaire()) return;
    setChargementAction(true);
    setErreur('');
    setSucces('');
    try {
      const payload = {
        annee: Number(formulaire.annee),
        montantPrevu: Number(formulaire.montantPrevu),
        centreCoutId: Number(formulaire.centreCoutId),
      };
      if (elementEnCours) {
        const modifie = await modifierBudget(elementEnCours.id, payload);
        setBudgets(prev => prev.map(b => b.id === modifie.id ? modifie : b));
        setSucces(`Budget ${modifie.annee} du centre « ${modifie.codeCenter} » mis à jour.`);
      } else {
        const cree = await creerBudget(payload);
        setBudgets(prev => [...prev, cree]);
        setSucces(`Budget ${cree.annee} du centre « ${cree.codeCenter} » créé avec succès.`);
      }
      setModaleOuverte(false);
    } catch (err) {
      setErreursChamps((prev) => ({ ...prev, ...erreursParChamp(err) }));
      setErreurModale(messageErreur(err));
    } finally {
      setChargementAction(false);
    }
  }

  async function confirmerSuppression() {
    if (!elementASupprimer) return;
    setChargementAction(true);
    setErreur('');
    setSucces('');
    try {
      await supprimerBudget(elementASupprimer.id);
      setBudgets(prev => prev.filter(b => b.id !== elementASupprimer.id));
      setSucces(`Budget ${elementASupprimer.annee} supprimé avec succès.`);
      setElementASupprimer(null);
    } catch (err) {
      setErreur(messageErreur(err));
      setElementASupprimer(null);
    } finally {
      setChargementAction(false);
    }
  }

  const anneesDisponibles = useMemo(() => {
    return [...new Set(budgets.map(b => b.annee))].sort((a, b) => b - a);
  }, [budgets]);

  const donneesFiltrees = useMemo(() => {
    const filtre = recherche.trim().toLowerCase();
    return budgets.filter(b => {
      const matchRecherche = !filtre
        || b.codeCenter?.toLowerCase().includes(filtre)
        || b.libelleCenter?.toLowerCase().includes(filtre);
      const matchAnnee = !filtreAnnee || String(b.annee) === filtreAnnee;
      return matchRecherche && matchAnnee;
    });
  }, [budgets, recherche, filtreAnnee]);

  const totalPrevu = useMemo(() =>
    donneesFiltrees.reduce((sum, b) => sum + Number(b.montantPrevu || 0), 0),
    [donneesFiltrees]
  );

  return (
    <section>
      <header className="entete-page">
        <div>
          <h1>Budgets CO</h1>
          <p className="texte-secondaire">
            Budgets prévisionnels par centre de coûts et par exercice.
          </p>
        </div>
        {peutModifier && (
          <button type="button" className="btn btn-primaire" onClick={ouvrirCreation} disabled={centres.length === 0}>
            <Icone nom="plus" taille={18} /> Nouveau budget
          </button>
        )}
      </header>

      {succes && <p className="message-succes" role="status">{succes}</p>}
      <MessageErreur message={erreur} />

      {chargement ? (
        <Chargement />
      ) : budgets.length === 0 ? (
        <div className="panneau vide">
          <Icone nom="centres" taille={36} />
          <p><strong>Aucun budget défini.</strong></p>
          <p className="texte-secondaire">
            Définissez des budgets prévisionnels pour chaque centre de coûts et exercice.
          </p>
          {peutModifier && centres.length > 0 && (
            <button type="button" className="btn btn-primaire" onClick={ouvrirCreation}>
              Créer le premier budget
            </button>
          )}
          {centres.length === 0 && (
            <p className="texte-secondaire" style={{ fontSize: '0.85rem' }}>
              Créez d'abord des centres de coûts pour pouvoir leur affecter un budget.
            </p>
          )}
        </div>
      ) : (
        <div className="panneau">
          <div className="barre-outils">
            <label className="recherche">
              <Icone nom="recherche" taille={18} />
              <input
                type="search"
                placeholder="Rechercher par code ou libellé de centre..."
                value={recherche}
                onChange={e => setRecherche(e.target.value)}
                aria-label="Rechercher"
              />
            </label>
            <select
              className="input"
              style={{ width: 'auto', minWidth: '120px' }}
              value={filtreAnnee}
              onChange={e => setFiltreAnnee(e.target.value)}
              aria-label="Filtrer par année"
            >
              <option value="">Toutes les années</option>
              {anneesDisponibles.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <span className="texte-secondaire">
              {donneesFiltrees.length} budget{donneesFiltrees.length > 1 ? 's' : ''} · Total : {montant(totalPrevu)} MAD
            </span>
          </div>

          <div className="defilement">
            <table className="tableau">
              <thead>
                <tr>
                  <th>Centre de coûts</th>
                  <th>Libellé</th>
                  <th>Année</th>
                  <th className="num">Montant prévu (MAD)</th>
                  {peutModifier && <th style={{ width: '90px', textAlign: 'center' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {donneesFiltrees.map(b => (
                  <tr key={b.id}>
                    <td><code className="badge-code">{b.codeCenter}</code></td>
                    <td>{b.libelleCenter}</td>
                    <td className="chiffres">{b.annee}</td>
                    <td className="num chiffres montant-fort">{montant(b.montantPrevu)}</td>
                    {peutModifier && (
                      <td style={{ textAlign: 'center' }}>
                        <div className="actions-cell">
                          <button
                            type="button"
                            className="btn-action"
                            onClick={() => ouvrirModification(b)}
                            title="Modifier"
                          >
                            <Icone nom="editer" taille={16} />
                          </button>
                          <button
                            type="button"
                            className="btn-action btn-action-supprimer"
                            onClick={() => setElementASupprimer(b)}
                            title="Supprimer"
                          >
                            <Icone nom="supprimer" taille={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {donneesFiltrees.length === 0 && (
                  <tr>
                    <td colSpan={peutModifier ? 5 : 4} className="texte-secondaire aucun-resultat">
                      Aucun résultat pour les filtres sélectionnés.
                    </td>
                  </tr>
                )}
              </tbody>
              {donneesFiltrees.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan={3}><strong>Total affiché</strong></td>
                    <td className="num chiffres montant-fort"><strong>{montant(totalPrevu)}</strong></td>
                    {peutModifier && <td />}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* MODALE CRÉATION / MODIFICATION */}
      {modaleOuverte && (
        <div className="modale-fond" onClick={() => setModaleOuverte(false)}>
          <div className="modale-boite" onClick={e => e.stopPropagation()}>
            <div className="modale-entete">
              <h2>{elementEnCours ? 'Modifier le budget' : 'Nouveau budget CO'}</h2>
              <button type="button" className="bouton-icone" onClick={() => setModaleOuverte(false)} title="Fermer">
                <Icone nom="croix" taille={18} />
              </button>
            </div>
            <form onSubmit={enregistrer}>
              <div className="modale-corps">
                <MessageErreur message={erreurModale} onFermer={() => setErreurModale('')} />
                <div className="champ">
                  <label className="champ-label" htmlFor="budget-centre">
                    Centre de coûts <span style={{ color: 'var(--corail)' }}>*</span>
                  </label>
                  <select
                    id="budget-centre"
                    className={`input ${erreursChamps.centreCoutId ? 'input-erreur' : ''}`}
                    value={formulaire.centreCoutId}
                    onChange={e => setFormulaire({ ...formulaire, centreCoutId: e.target.value })}
                    required
                  >
                    <option value="">— Sélectionner un centre —</option>
                    {centres.map(c => (
                      <option key={c.id} value={c.id}>{c.code} — {c.libelle}</option>
                    ))}
                  </select>
                  {erreursChamps.centreCoutId && <span className="champ-erreur">{erreursChamps.centreCoutId}</span>}
                </div>

                <div className="champ">
                  <label className="champ-label" htmlFor="budget-annee">
                    Année <span style={{ color: 'var(--corail)' }}>*</span>
                  </label>
                  <input
                    id="budget-annee"
                    type="number"
                    min="2000"
                    max="2099"
                    className={`input ${erreursChamps.annee ? 'input-erreur' : ''}`}
                    value={formulaire.annee}
                    onChange={e => setFormulaire({ ...formulaire, annee: e.target.value })}
                    required
                  />
                  {erreursChamps.annee && <span className="champ-erreur">{erreursChamps.annee}</span>}
                </div>

                <div className="champ">
                  <label className="champ-label" htmlFor="budget-montant">
                    Montant prévu (MAD) <span style={{ color: 'var(--corail)' }}>*</span>
                  </label>
                  <input
                    id="budget-montant"
                    type="number"
                    step="0.01"
                    min="0"
                    className={`input ${erreursChamps.montantPrevu ? 'input-erreur' : ''}`}
                    value={formulaire.montantPrevu}
                    onChange={e => setFormulaire({ ...formulaire, montantPrevu: e.target.value })}
                    placeholder="Ex. 500000"
                    required
                  />
                  {erreursChamps.montantPrevu && <span className="champ-erreur">{erreursChamps.montantPrevu}</span>}
                  <span className="champ-aide">Montant prévisionnel annuel pour ce centre (≥ 0, 2 décimales max). Un seul budget par centre et par année ; le budget d'un exercice clôturé est figé.</span>
                </div>
              </div>

              <div className="modale-pied">
                <button type="button" className="btn btn-secondaire" onClick={() => setModaleOuverte(false)} disabled={chargementAction}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primaire" disabled={chargementAction}>
                  {chargementAction ? 'Enregistrement...' : elementEnCours ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE SUPPRESSION */}
      {elementASupprimer && (
        <div className="modale-fond" onClick={() => setElementASupprimer(null)}>
          <div className="modale-boite" onClick={e => e.stopPropagation()}>
            <div className="modale-entete">
              <h2>Confirmer la suppression</h2>
              <button type="button" className="bouton-icone" onClick={() => setElementASupprimer(null)}>
                <Icone nom="croix" taille={18} />
              </button>
            </div>
            <div className="modale-corps">
              <p>
                Êtes-vous sûr de vouloir supprimer le budget <strong>« {elementASupprimer.annee} »</strong>{' '}
                du centre <strong>« {elementASupprimer.codeCenter} »</strong> ?
              </p>
              <p className="texte-secondaire" style={{ fontSize: '0.86rem' }}>
                Cette action est irréversible.
              </p>
            </div>
            <div className="modale-pied">
              <button type="button" className="btn btn-secondaire" onClick={() => setElementASupprimer(null)} disabled={chargementAction}>
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-primaire"
                style={{ background: 'var(--corail)', borderColor: 'var(--encre)' }}
                onClick={confirmerSuppression}
                disabled={chargementAction}
              >
                {chargementAction ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
