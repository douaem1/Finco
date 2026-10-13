import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  listerExercices, creerExercice, modifierExercice,
  cloturerExercice, supprimerExercice,
} from '../services/exerciceApi';
import { erreursParChamp, messageErreur } from '../services/api';
import { dateFr } from '../utils/format';
import MessageErreur from '../components/MessageErreur';
import Chargement from '../components/Chargement';
import Icone from '../components/Icone';

const ANNEE_COURANTE = new Date().getFullYear();

function badgeStatut(cloture) {
  return cloture
    ? <span className="badge badge-neutre">Clôturé</span>
    : <span className="badge badge-succes">Ouvert</span>;
}

export default function Exercices() {
  const { utilisateur } = useAuth();

  const [exercices, setExercices] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');

  // Modale création / modification
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [elementEnCours, setElementEnCours] = useState(null);
  const [formulaire, setFormulaire] = useState({
    annee: String(ANNEE_COURANTE),
    dateDebut: `${ANNEE_COURANTE}-01-01`,
    dateFin: `${ANNEE_COURANTE}-12-31`,
  });
  const [erreursChamps, setErreursChamps] = useState({});
  const [erreurModale, setErreurModale] = useState('');
  const [chargementAction, setChargementAction] = useState(false);

  // Modale suppression
  const [elementASupprimer, setElementASupprimer] = useState(null);
  // Modale clôture
  const [elementACloturer, setElementACloturer] = useState(null);

  // Les exercices relèvent de l'espace COMPTABLE (roleAccess.js + SecurityConfig) :
  // c'est donc le comptable qui crée, modifie, clôture et supprime un exercice.
  const peutEcrire = utilisateur?.role === 'COMPTABLE';
  const peutAdmin = utilisateur?.role === 'COMPTABLE';

  useEffect(() => { chargerDonnees(); }, []);

  async function chargerDonnees() {
    setChargement(true);
    setErreur('');
    try {
      const data = await listerExercices();
      setExercices(data);
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
      dateDebut: `${ANNEE_COURANTE}-01-01`,
      dateFin: `${ANNEE_COURANTE}-12-31`,
    });
    setErreursChamps({});
    setErreurModale('');
    setModaleOuverte(true);
  }

  function ouvrirModification(ex) {
    setElementEnCours(ex);
    setFormulaire({
      annee: String(ex.annee),
      dateDebut: ex.dateDebut,
      dateFin: ex.dateFin,
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
    if (!formulaire.dateDebut) errs.dateDebut = 'La date de début est obligatoire.';
    if (!formulaire.dateFin) errs.dateFin = 'La date de fin est obligatoire.';
    if (formulaire.dateDebut && formulaire.dateFin && formulaire.dateDebut >= formulaire.dateFin) {
      errs.dateFin = 'La date de fin doit être postérieure à la date de début.';
    } else if (formulaire.dateDebut && formulaire.dateFin) {
      // Aide à la saisie : un exercice dure au plus 12 mois (le serveur le vérifie aussi).
      const limite = new Date(formulaire.dateDebut);
      limite.setFullYear(limite.getFullYear() + 1);
      limite.setDate(limite.getDate() - 1);
      if (new Date(formulaire.dateFin) > limite) {
        errs.dateFin = 'Un exercice comptable ne peut pas dépasser 12 mois.';
      }
      const anneesPossibles = [formulaire.dateDebut.slice(0, 4), formulaire.dateFin.slice(0, 4)];
      if (!errs.annee && !anneesPossibles.includes(String(formulaire.annee))) {
        errs.annee = "L'année doit correspondre à l'année de début ou de fin de l'exercice.";
      }
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
        dateDebut: formulaire.dateDebut,
        dateFin: formulaire.dateFin,
      };
      if (elementEnCours) {
        const modifie = await modifierExercice(elementEnCours.id, payload);
        setExercices(prev => prev.map(ex => ex.id === modifie.id ? modifie : ex));
        setSucces(`Exercice ${modifie.annee} mis à jour avec succès.`);
      } else {
        const cree = await creerExercice(payload);
        setExercices(prev => [cree, ...prev]);
        setSucces(`Exercice ${cree.annee} créé avec succès.`);
      }
      setModaleOuverte(false);
    } catch (err) {
      setErreursChamps((prev) => ({ ...prev, ...erreursParChamp(err) }));
      setErreurModale(messageErreur(err));
    } finally {
      setChargementAction(false);
    }
  }

  async function confirmerCloture() {
    if (!elementACloturer) return;
    setChargementAction(true);
    setErreur('');
    setSucces('');
    try {
      const cloture = await cloturerExercice(elementACloturer.id);
      setExercices(prev => prev.map(ex => ex.id === cloture.id ? cloture : ex));
      setSucces(`Exercice ${cloture.annee} clôturé avec succès.`);
      setElementACloturer(null);
    } catch (err) {
      setErreur(messageErreur(err));
      setElementACloturer(null);
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
      await supprimerExercice(elementASupprimer.id);
      setExercices(prev => prev.filter(ex => ex.id !== elementASupprimer.id));
      setSucces(`Exercice ${elementASupprimer.annee} supprimé avec succès.`);
      setElementASupprimer(null);
    } catch (err) {
      setErreur(messageErreur(err));
      setElementASupprimer(null);
    } finally {
      setChargementAction(false);
    }
  }

  const ouverts = useMemo(() => exercices.filter(e => !e.cloture).length, [exercices]);
  const clotures = useMemo(() => exercices.filter(e => e.cloture).length, [exercices]);

  return (
    <section>
      <header className="entete-page">
        <div>
          <h1>Exercices comptables</h1>
          <p className="texte-secondaire">
            Gérez les périodes de saisie : {ouverts} ouvert{ouverts > 1 ? 's' : ''} · {clotures} clôturé{clotures > 1 ? 's' : ''}.
          </p>
        </div>
        {peutEcrire && (
          <button type="button" className="btn btn-primaire" onClick={ouvrirCreation}>
            <Icone nom="plus" taille={18} /> Nouvel exercice
          </button>
        )}
      </header>

      {succes && <p className="message-succes" role="status">{succes}</p>}
      <MessageErreur message={erreur} />

      {chargement ? (
        <Chargement />
      ) : exercices.length === 0 ? (
        <div className="panneau vide">
          <Icone nom="journal" taille={36} />
          <p><strong>Aucun exercice comptable.</strong></p>
          <p className="texte-secondaire">Créez le premier exercice pour commencer la saisie des écritures.</p>
          {peutEcrire && (
            <button type="button" className="btn btn-primaire" onClick={ouvrirCreation}>
              Créer le premier exercice
            </button>
          )}
        </div>
      ) : (
        <div className="panneau">
          <div className="defilement">
            <table className="tableau">
              <thead>
                <tr>
                  <th>Année</th>
                  <th>Date de début</th>
                  <th>Date de fin</th>
                  <th>Statut</th>
                  {(peutEcrire || peutAdmin) && <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {exercices.map(ex => (
                  <tr key={ex.id}>
                    <td><strong>{ex.annee}</strong></td>
                    <td className="chiffres">{dateFr(ex.dateDebut)}</td>
                    <td className="chiffres">{dateFr(ex.dateFin)}</td>
                    <td>{badgeStatut(ex.cloture)}</td>
                    {(peutEcrire || peutAdmin) && (
                      <td style={{ textAlign: 'center' }}>
                        <div className="actions-cell">
                          {peutEcrire && !ex.cloture && (
                            <button
                              type="button"
                              className="btn-action"
                              onClick={() => ouvrirModification(ex)}
                              title="Modifier"
                            >
                              <Icone nom="editer" taille={16} />
                            </button>
                          )}
                          {peutAdmin && !ex.cloture && (
                            <button
                              type="button"
                              className="btn-action"
                              style={{ color: 'var(--sarcelle)' }}
                              onClick={() => setElementACloturer(ex)}
                              title="Clôturer"
                            >
                              <Icone nom="verrou" taille={16} />
                            </button>
                          )}
                          {peutAdmin && (
                            <button
                              type="button"
                              className="btn-action btn-action-supprimer"
                              onClick={() => setElementASupprimer(ex)}
                              title="Supprimer"
                            >
                              <Icone nom="supprimer" taille={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALE CRÉATION / MODIFICATION */}
      {modaleOuverte && (
        <div className="modale-fond" onClick={() => setModaleOuverte(false)}>
          <div className="modale-boite" onClick={e => e.stopPropagation()}>
            <div className="modale-entete">
              <h2>{elementEnCours ? 'Modifier l\'exercice' : 'Nouvel exercice comptable'}</h2>
              <button type="button" className="bouton-icone" onClick={() => setModaleOuverte(false)} title="Fermer">
                <Icone nom="croix" taille={18} />
              </button>
            </div>
            <form onSubmit={enregistrer}>
              <div className="modale-corps">
                <MessageErreur message={erreurModale} onFermer={() => setErreurModale('')} />
                <div className="champ">
                  <label className="champ-label" htmlFor="exercice-annee">
                    Année <span style={{ color: 'var(--corail)' }}>*</span>
                  </label>
                  <input
                    id="exercice-annee"
                    type="number"
                    min="2000"
                    max="2099"
                    className={`input ${erreursChamps.annee ? 'input-erreur' : ''}`}
                    value={formulaire.annee}
                    onChange={e => {
                      const a = e.target.value;
                      setFormulaire({
                        ...formulaire,
                        annee: a,
                        dateDebut: `${a}-01-01`,
                        dateFin: `${a}-12-31`,
                      });
                    }}
                    required
                  />
                  {erreursChamps.annee && <span className="champ-erreur">{erreursChamps.annee}</span>}
                </div>

                <div className="champ">
                  <label className="champ-label" htmlFor="exercice-debut">
                    Date de début <span style={{ color: 'var(--corail)' }}>*</span>
                  </label>
                  <input
                    id="exercice-debut"
                    type="date"
                    className={`input ${erreursChamps.dateDebut ? 'input-erreur' : ''}`}
                    value={formulaire.dateDebut}
                    onChange={e => setFormulaire({ ...formulaire, dateDebut: e.target.value })}
                    required
                  />
                  {erreursChamps.dateDebut && <span className="champ-erreur">{erreursChamps.dateDebut}</span>}
                </div>

                <div className="champ">
                  <label className="champ-label" htmlFor="exercice-fin">
                    Date de fin <span style={{ color: 'var(--corail)' }}>*</span>
                  </label>
                  <input
                    id="exercice-fin"
                    type="date"
                    className={`input ${erreursChamps.dateFin ? 'input-erreur' : ''}`}
                    value={formulaire.dateFin}
                    onChange={e => setFormulaire({ ...formulaire, dateFin: e.target.value })}
                    required
                  />
                  {erreursChamps.dateFin
                    ? <span className="champ-erreur">{erreursChamps.dateFin}</span>
                    : <span className="champ-aide">12 mois maximum, sans chevaucher un autre exercice.</span>}
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

      {/* MODALE CLÔTURE */}
      {elementACloturer && (
        <div className="modale-fond" onClick={() => setElementACloturer(null)}>
          <div className="modale-boite" onClick={e => e.stopPropagation()}>
            <div className="modale-entete">
              <h2>Clôturer l'exercice</h2>
              <button type="button" className="bouton-icone" onClick={() => setElementACloturer(null)}>
                <Icone nom="croix" taille={18} />
              </button>
            </div>
            <div className="modale-corps">
              <p>
                Êtes-vous sûr de vouloir clôturer l'exercice <strong>« {elementACloturer.annee} »</strong> ?
              </p>
              <p className="texte-secondaire" style={{ fontSize: '0.86rem' }}>
                Une fois clôturé, aucune écriture ne pourra plus être saisie sur cet exercice. Cette action est irréversible.
              </p>
            </div>
            <div className="modale-pied">
              <button type="button" className="btn btn-secondaire" onClick={() => setElementACloturer(null)} disabled={chargementAction}>
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-primaire"
                style={{ background: 'var(--sarcelle)', borderColor: 'var(--encre)' }}
                onClick={confirmerCloture}
                disabled={chargementAction}
              >
                {chargementAction ? 'Clôture en cours...' : 'Confirmer la clôture'}
              </button>
            </div>
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
                Êtes-vous sûr de vouloir supprimer l'exercice <strong>« {elementASupprimer.annee} »</strong> ?
              </p>
              <p className="texte-secondaire" style={{ fontSize: '0.86rem' }}>
                La suppression est refusée par le serveur si des pièces comptables sont rattachées à cet exercice.
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
