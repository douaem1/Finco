import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  listerBudgets, creerBudget, modifierBudget, supprimerBudget,
} from '../services/budgetApi';
import { listerCentres } from '../services/centreCoutApi';
import { erreursParChamp, messageErreur } from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import AsyncState from '../components/ui/AsyncState';
import DataTable, { MenuActionsLigne, BasculeDensite, MenuColonnes } from '../components/ui/DataTable';
import SearchToolbar from '../components/ui/SearchToolbar';
import Amount from '../components/ui/Amount';
import Field from '../components/ui/Field';
import Combobox from '../components/ui/Combobox';
import Button from '../components/ui/Button';
import CrudModal from '../components/ui/CrudModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import MessageErreur from '../components/MessageErreur';
import Icone from '../components/Icone';
import { useToast } from '../components/ui/ToastRegion';

const ANNEE_COURANTE = new Date().getFullYear();

export default function Budgets() {
  const { utilisateur } = useAuth();
  const { showToast } = useToast();

  const [budgets, setBudgets] = useState([]);
  const [centres, setCentres] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
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
    setErreurModale('');
    try {
      const payload = {
        annee: Number(formulaire.annee),
        montantPrevu: Number(formulaire.montantPrevu),
        centreCoutId: Number(formulaire.centreCoutId),
      };
      if (elementEnCours) {
        const modifie = await modifierBudget(elementEnCours.id, payload);
        setBudgets(prev => prev.map(b => b.id === modifie.id ? modifie : b));
        showToast(`Budget ${modifie.annee} du centre « ${modifie.codeCenter} » mis à jour.`);
      } else {
        const cree = await creerBudget(payload);
        setBudgets(prev => [...prev, cree]);
        showToast(`Budget ${cree.annee} du centre « ${cree.codeCenter} » créé avec succès.`);
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
    try {
      await supprimerBudget(elementASupprimer.id);
      setBudgets(prev => prev.filter(b => b.id !== elementASupprimer.id));
      showToast(`Budget ${elementASupprimer.annee} supprimé avec succès.`);
      setElementASupprimer(null);
    } catch (err) {
      showToast(messageErreur(err), 'error');
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

  const colonnes = [
    {
      key: 'codeCenter',
      label: 'Centre de coûts',
      sortable: true,
      priorite: 1,
      cell: (b) => ({
        principal: <code className="badge-code">{b.codeCenter}</code>,
        secondaire: b.libelleCenter,
      }),
    },
    {
      key: 'annee',
      label: 'Exercice',
      sortable: true,
      nowrap: true,
      priorite: 2,
      render: (b) => <span className="chiffres">{b.annee}</span>,
    },
    {
      key: 'montantPrevu',
      label: 'Montant prévu (MAD)',
      numeric: true,
      sortable: true,
      nowrap: true,
      priorite: 1,
      render: (b) => <strong><Amount value={b.montantPrevu} /></strong>,
    },
  ];
  if (peutModifier) {
    colonnes.push({
      key: 'actions',
      label: 'Actions',
      actions: true,
      masquable: false,
      render: (b) => (
        <MenuActionsLigne
          actions={[
            { label: 'Modifier', icone: 'editer', onSelect: () => ouvrirModification(b), principale: true },
            { label: 'Supprimer', icone: 'supprimer', onSelect: () => setElementASupprimer(b), danger: true, separateurAvant: true },
          ]}
        />
      ),
    });
  }

  return (
    <section>
      <PageHeader
        title="Budgets CO"
        description="Budgets prévisionnels par centre de coûts et par exercice."
        actions={peutModifier ? (
          <Button type="button" onClick={ouvrirCreation} disabled={centres.length === 0}>
            <Icone nom="plus" taille={18} /> Nouveau budget
          </Button>
        ) : undefined}
      />

      <AsyncState
        loading={chargement}
        error={erreur}
        onRetry={chargerDonnees}
        empty={!chargement && !erreur && budgets.length === 0}
        emptyTitle="Aucun budget défini."
        emptyDescription={centres.length === 0
          ? 'Créez d\'abord des centres de coûts pour pouvoir leur affecter un budget.'
          : 'Définissez des budgets prévisionnels pour chaque centre de coûts et exercice.'}
        emptyAction={peutModifier && centres.length > 0
          ? <Button type="button" onClick={ouvrirCreation}>Créer le premier budget</Button>
          : undefined}
      >
        <div className="carte-resume">
          <div className="carte-resume-item"><small>Budgets affichés</small>{donneesFiltrees.length}</div>
          <div className="carte-resume-item accent"><small>Total prévu</small><Amount value={totalPrevu} /></div>
        </div>

        <div className="panneau">
          <SearchToolbar
            value={recherche}
            onChange={setRecherche}
            placeholder="Rechercher par code ou libellé de centre…"
            resultCount={`${donneesFiltrees.length} budget${donneesFiltrees.length > 1 ? 's' : ''}`}
            actions={<><BasculeDensite /><MenuColonnes storageKey="budgets" colonnes={colonnes} /></>}
          >
            <select
              className="input filtre-annee"
              value={filtreAnnee}
              onChange={e => setFiltreAnnee(e.target.value)}
              aria-label="Filtrer par année"
            >
              <option value="">Toutes les années</option>
              {anneesDisponibles.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </SearchToolbar>
          <DataTable columns={colonnes} rows={donneesFiltrees} storageKey="budgets" empty="Aucun résultat pour les filtres sélectionnés." />
        </div>
      </AsyncState>

      {/* MODALE CRÉATION / MODIFICATION */}
      <CrudModal
        open={modaleOuverte}
        onOpenChange={setModaleOuverte}
        title={elementEnCours ? 'Modifier le budget' : 'Nouveau budget CO'}
        footer={(
          <>
            <Button variant="secondary" type="button" onClick={() => setModaleOuverte(false)} disabled={chargementAction}>
              Annuler
            </Button>
            <Button type="submit" form="formulaire-budget" loading={chargementAction} disabled={centres.length === 0}>
              {chargementAction ? 'Enregistrement…' : elementEnCours ? 'Mettre à jour' : 'Créer'}
            </Button>
          </>
        )}
      >
        <MessageErreur message={erreurModale} onFermer={() => setErreurModale('')} />
        <form id="formulaire-budget" className="pile" onSubmit={enregistrer}>
          <Combobox
            id="budget-centre"
            label="Centre de coûts"
            options={centres.map(c => ({ value: String(c.id), label: `${c.code} — ${c.libelle}` }))}
            value={formulaire.centreCoutId}
            onChange={(v) => setFormulaire({ ...formulaire, centreCoutId: v })}
            placeholder="Sélectionner un centre"
            required
            error={erreursChamps.centreCoutId}
            hint={centres.length === 0 ? 'Créez d\'abord des centres de coûts dans l\'espace Centres de coûts.' : undefined}
          />
          <div className="grille-formulaire">
            <Field id="budget-annee" label="Année" required error={erreursChamps.annee}>
              {(p) => (
                <input
                  className="input"
                  type="number"
                  min="2000"
                  max="2099"
                  value={formulaire.annee}
                  onChange={e => setFormulaire({ ...formulaire, annee: e.target.value })}
                  {...p}
                />
              )}
            </Field>
            <Field
              id="budget-montant"
              label="Montant prévu (MAD)"
              required
              error={erreursChamps.montantPrevu}
              hint="Montant prévisionnel annuel pour ce centre (≥ 0, 2 décimales max). Un seul budget par centre et par année ; le budget d'un exercice clôturé est figé."
            >
              {(p) => (
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ex. 500000"
                  value={formulaire.montantPrevu}
                  onChange={e => setFormulaire({ ...formulaire, montantPrevu: e.target.value })}
                  {...p}
                />
              )}
            </Field>
          </div>
        </form>
      </CrudModal>

      {/* MODALE SUPPRESSION */}
      <ConfirmDialog
        open={Boolean(elementASupprimer)}
        onOpenChange={(o) => !o && setElementASupprimer(null)}
        title="Confirmer la suppression"
        description={elementASupprimer ? `Êtes-vous sûr de vouloir supprimer le budget « ${elementASupprimer.annee} » du centre « ${elementASupprimer.codeCenter} » ? Cette action est irréversible.` : ''}
        confirmLabel="Supprimer définitivement"
        danger
        loading={chargementAction}
        onConfirm={confirmerSuppression}
      />
    </section>
  );
}
