import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  listerExercices, creerExercice, modifierExercice,
  cloturerExercice, supprimerExercice,
} from '../services/exerciceApi';
import { erreursParChamp, messageErreur } from '../services/api';
import { dateFr } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import AsyncState from '../components/ui/AsyncState';
import DataTable, { BasculeDensite, MenuColonnes, MenuActionsLigne } from '../components/ui/DataTable';
import SearchToolbar from '../components/ui/SearchToolbar';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import CrudModal from '../components/ui/CrudModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import MessageErreur from '../components/MessageErreur';
import Icone from '../components/Icone';
import { useToast } from '../components/ui/ToastRegion';

const ANNEE_COURANTE = new Date().getFullYear();

export default function Exercices() {
  const { utilisateur } = useAuth();
  const { showToast } = useToast();

  const [exercices, setExercices] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [recherche, setRecherche] = useState('');

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
      errs.annee = "L'année doit être comprise entre 2000 et 2099.";
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
    setErreurModale('');
    try {
      const payload = {
        annee: Number(formulaire.annee),
        dateDebut: formulaire.dateDebut,
        dateFin: formulaire.dateFin,
      };
      if (elementEnCours) {
        const modifie = await modifierExercice(elementEnCours.id, payload);
        setExercices(prev => prev.map(ex => ex.id === modifie.id ? modifie : ex));
        showToast(`Exercice ${modifie.annee} mis à jour avec succès.`);
      } else {
        const cree = await creerExercice(payload);
        setExercices(prev => [cree, ...prev]);
        showToast(`Exercice ${cree.annee} créé avec succès.`);
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
    try {
      const cloture = await cloturerExercice(elementACloturer.id);
      setExercices(prev => prev.map(ex => ex.id === cloture.id ? cloture : ex));
      showToast(`Exercice ${cloture.annee} clôturé avec succès.`);
      setElementACloturer(null);
    } catch (err) {
      showToast(messageErreur(err), 'error');
      setElementACloturer(null);
    } finally {
      setChargementAction(false);
    }
  }

  async function confirmerSuppression() {
    if (!elementASupprimer) return;
    setChargementAction(true);
    try {
      await supprimerExercice(elementASupprimer.id);
      setExercices(prev => prev.filter(ex => ex.id !== elementASupprimer.id));
      showToast(`Exercice ${elementASupprimer.annee} supprimé avec succès.`);
      setElementASupprimer(null);
    } catch (err) {
      showToast(messageErreur(err), 'error');
      setElementASupprimer(null);
    } finally {
      setChargementAction(false);
    }
  }

  const ouverts = useMemo(() => exercices.filter(e => !e.cloture).length, [exercices]);
  const clotures = useMemo(() => exercices.filter(e => e.cloture).length, [exercices]);

  const filtre = recherche.trim().toLowerCase();
  const exercicesVisibles = useMemo(
    () => exercices.filter((ex) => !filtre || `${ex.annee} ${ex.dateDebut} ${ex.dateFin}`.toLowerCase().includes(filtre)),
    [exercices, filtre],
  );

  const colonnes = [
    { key: 'annee', label: 'Année', priorite: 1, render: (ex) => <strong>{ex.annee}</strong> },
    { key: 'dateDebut', label: 'Date de début', priorite: 2, render: (ex) => <span className="chiffres">{dateFr(ex.dateDebut)}</span> },
    { key: 'dateFin', label: 'Date de fin', priorite: 3, render: (ex) => <span className="chiffres">{dateFr(ex.dateFin)}</span> },
    { key: 'statut', label: 'Statut', priorite: 1, render: (ex) => <StatusBadge status={ex.cloture ? 'CLOTURE' : 'OUVERT'} /> },
    ...((peutEcrire || peutAdmin) ? [{
      key: 'actions',
      label: 'Actions',
      actions: true,
      masquable: false,
      render: (ex) => (
        <MenuActionsLigne
          label={`Actions pour l'exercice ${ex.annee}`}
          actions={[
            ...(peutEcrire && !ex.cloture ? [{ label: 'Modifier', icone: 'editer', principale: true, onSelect: () => ouvrirModification(ex) }] : []),
            ...(peutAdmin && !ex.cloture ? [{ label: 'Clôturer', icone: 'verrou', onSelect: () => setElementACloturer(ex) }] : []),
            ...(peutAdmin ? [{ label: 'Supprimer', icone: 'supprimer', danger: true, separateurAvant: true, onSelect: () => setElementASupprimer(ex) }] : []),
          ]}
        />
      ),
    }] : []),
  ];

  return (
    <section>
      <PageHeader
        title="Exercices comptables"
        description={`Gérez les périodes de saisie : ${ouverts} ouvert${ouverts > 1 ? 's' : ''} · ${clotures} clôturé${clotures > 1 ? 's' : ''}.`}
        actions={peutEcrire && (
          <Button type="button" onClick={ouvrirCreation}>
            <Icone nom="plus" taille={18} /> Nouvel exercice
          </Button>
        )}
      />

      <AsyncState
        loading={chargement}
        error={erreur}
        onRetry={chargerDonnees}
        empty={exercices.length === 0}
        emptyTitle="Aucun exercice comptable."
        emptyDescription="Créez le premier exercice pour commencer la saisie des écritures."
        emptyAction={peutEcrire && (
          <Button type="button" onClick={ouvrirCreation}>Créer le premier exercice</Button>
        )}
      >
        <div className="panneau">
          <SearchToolbar
            value={recherche}
            onChange={setRecherche}
            placeholder="Rechercher par année ou date…"
            resultCount={`${exercicesVisibles.length} exercice${exercicesVisibles.length > 1 ? 's' : ''}`}
            actions={<><BasculeDensite /><MenuColonnes storageKey="exercices" colonnes={colonnes} /></>}
          />
          <DataTable columns={colonnes} rows={exercicesVisibles} storageKey="exercices" empty="Aucun exercice à afficher." />
        </div>
      </AsyncState>

      <CrudModal
        open={modaleOuverte}
        onOpenChange={setModaleOuverte}
        title={elementEnCours ? "Modifier l'exercice" : 'Nouvel exercice comptable'}
        footer={(
          <>
            <Button variant="secondary" type="button" onClick={() => setModaleOuverte(false)}>Annuler</Button>
            <Button type="submit" form="formulaire-exercice" loading={chargementAction}>
              {chargementAction ? 'Enregistrement…' : elementEnCours ? 'Mettre à jour' : 'Créer'}
            </Button>
          </>
        )}
      >
        <MessageErreur message={erreurModale} onFermer={() => setErreurModale('')} />
        <form id="formulaire-exercice" className="pile" onSubmit={enregistrer}>
          <Field id="exercice-annee" label="Année" required error={erreursChamps.annee}>
            {(p) => (
              <input
                className="input"
                type="number"
                min="2000"
                max="2099"
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
                {...p}
              />
            )}
          </Field>

          <Field id="exercice-debut" label="Date de début" required error={erreursChamps.dateDebut}>
            {(p) => (
              <input
                className="input"
                type="date"
                value={formulaire.dateDebut}
                onChange={e => setFormulaire({ ...formulaire, dateDebut: e.target.value })}
                {...p}
              />
            )}
          </Field>

          <Field
            id="exercice-fin"
            label="Date de fin"
            required
            error={erreursChamps.dateFin}
            hint="12 mois maximum, sans chevaucher un autre exercice."
          >
            {(p) => (
              <input
                className="input"
                type="date"
                value={formulaire.dateFin}
                onChange={e => setFormulaire({ ...formulaire, dateFin: e.target.value })}
                {...p}
              />
            )}
          </Field>
        </form>
      </CrudModal>

      <ConfirmDialog
        open={Boolean(elementACloturer)}
        onOpenChange={(o) => !o && setElementACloturer(null)}
        title="Clôturer l'exercice"
        description={elementACloturer
          ? `Clôturer l'exercice « ${elementACloturer.annee} » ? Une fois clôturé, aucune écriture ne pourra plus être saisie sur cet exercice. Cette action est irréversible.`
          : ''}
        confirmLabel="Confirmer la clôture"
        danger
        loading={chargementAction}
        onConfirm={confirmerCloture}
      />

      <ConfirmDialog
        open={Boolean(elementASupprimer)}
        onOpenChange={(o) => !o && setElementASupprimer(null)}
        title="Supprimer l'exercice"
        description={elementASupprimer
          ? `Supprimer l'exercice « ${elementASupprimer.annee} » ? Cette action est irréversible. La suppression est refusée par le serveur si des pièces comptables sont rattachées à cet exercice.`
          : ''}
        confirmLabel="Supprimer définitivement"
        danger
        loading={chargementAction}
        onConfirm={confirmerSuppression}
      />
    </section>
  );
}
