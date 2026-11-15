import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { listerCentres, creerCentre, modifierCentre, supprimerCentre } from '../services/centreCoutApi';
import { erreursParChamp, messageErreur } from '../services/api';
import Icone from '../components/Icone';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import StatusBadge from '../components/ui/StatusBadge';
import PageHeader from '../components/ui/PageHeader';
import CrudModal from '../components/ui/CrudModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import AsyncState from '../components/ui/AsyncState';
import DataTable, { MenuActionsLigne, BasculeDensite, MenuColonnes } from '../components/ui/DataTable';
import SearchToolbar from '../components/ui/SearchToolbar';
import EmptyState from '../components/ui/EmptyState';
import { useToast } from '../components/ui/ToastRegion';

export default function CentresCout() {
  const { utilisateur } = useAuth();
  const { showToast } = useToast();
  const [centres, setCentres] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [recherche, setRecherche] = useState('');
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [centreEnCours, setCentreEnCours] = useState(null);
  const [formulaire, setFormulaire] = useState({ code: '', libelle: '', principal: true, cleRepartition: '0' });
  const [erreursChamps, setErreursChamps] = useState({});
  const [erreurModale, setErreurModale] = useState('');
  const [chargementAction, setChargementAction] = useState(false);
  const [centreASupprimer, setCentreASupprimer] = useState(null);
  const estControleur = utilisateur?.role === 'CONTROLEUR';

  useEffect(() => { chargerCentres(); }, []);

  async function chargerCentres() {
    setChargement(true);
    setErreur('');
    try {
      setCentres(await listerCentres());
    } catch (error) {
      setErreur(messageErreur(error));
    } finally {
      setChargement(false);
    }
  }

  function ouvrirCreation() {
    setCentreEnCours(null);
    setFormulaire({ code: '', libelle: '', principal: true, cleRepartition: '0' });
    setErreursChamps({});
    setErreurModale('');
    setModaleOuverte(true);
  }

  function ouvrirModification(centre) {
    setCentreEnCours(centre);
    setFormulaire({ code: centre.code, libelle: centre.libelle, principal: centre.principal, cleRepartition: String(centre.cleRepartition ?? 0) });
    setErreursChamps({});
    setErreurModale('');
    setModaleOuverte(true);
  }

  function validerFormulaire() {
    const erreurs = {};
    const code = formulaire.code.trim().toUpperCase();
    if (!code) erreurs.code = 'Le code du centre est obligatoire.';
    else if (code.length < 2 || code.length > 10) erreurs.code = 'Le code doit comporter entre 2 et 10 caractères.';
    else if (!/^[A-Z0-9_]{2,10}$/.test(code)) erreurs.code = 'Le code ne doit contenir que des majuscules, chiffres et le caractère « _ ».';
    const libelle = formulaire.libelle.trim();
    if (!libelle) erreurs.libelle = 'Le libellé du centre est obligatoire.';
    else if (libelle.length > 100) erreurs.libelle = 'Le libellé ne doit pas dépasser 100 caractères.';
    const cle = Number(formulaire.cleRepartition);
    if (!Number.isFinite(cle) || cle < 0 || !/^\d+([.,]\d{1,2})?$/.test(String(formulaire.cleRepartition).trim())) erreurs.cleRepartition = 'La clé de répartition doit être positive et comporter au plus deux décimales.';
    setErreursChamps(erreurs);
    return Object.keys(erreurs).length === 0;
  }

  async function enregistrer(event) {
    event.preventDefault();
    if (!validerFormulaire()) return;
    setChargementAction(true);
    setErreurModale('');
    const payload = { code: formulaire.code.trim().toUpperCase(), libelle: formulaire.libelle.trim(), principal: Boolean(formulaire.principal), cleRepartition: Number(String(formulaire.cleRepartition).replace(',', '.')) };
    try {
      if (centreEnCours) {
        const modifie = await modifierCentre(centreEnCours.id, payload);
        setCentres((precedents) => precedents.map((centre) => (centre.id === modifie.id ? modifie : centre)));
        showToast(`Centre de coûts « ${modifie.code} - ${modifie.libelle} » mis à jour avec succès.`);
      } else {
        const cree = await creerCentre(payload);
        setCentres((precedents) => [...precedents, cree].sort((a, b) => a.code.localeCompare(b.code)));
        showToast(`Centre de coûts « ${cree.code} - ${cree.libelle} » créé avec succès.`);
      }
      setModaleOuverte(false);
    } catch (error) {
      setErreursChamps((precedents) => ({ ...precedents, ...erreursParChamp(error) }));
      setErreurModale(messageErreur(error));
    } finally {
      setChargementAction(false);
    }
  }

  async function confirmerSuppression() {
    if (!centreASupprimer) return;
    setChargementAction(true);
    try {
      await supprimerCentre(centreASupprimer.id);
      setCentres((precedents) => precedents.filter((centre) => centre.id !== centreASupprimer.id));
      showToast(`Centre de coûts « ${centreASupprimer.code} - ${centreASupprimer.libelle} » supprimé avec succès.`);
      setCentreASupprimer(null);
    } catch (error) {
      setErreur(messageErreur(error));
      setCentreASupprimer(null);
    } finally {
      setChargementAction(false);
    }
  }

  const filtre = recherche.trim().toLowerCase();
  const centresVisibles = useMemo(() => centres.filter((centre) => !filtre || centre.code.toLowerCase().includes(filtre) || centre.libelle.toLowerCase().includes(filtre)), [centres, filtre]);
  const columns = useMemo(() => [
    {
      key: 'code',
      label: 'Centre',
      sortable: true,
      priorite: 1,
      cell: (centre) => ({
        principal: <span className="code-centre">{centre.code}</span>,
        secondaire: centre.libelle,
      }),
    },
    { key: 'principal', label: 'Type', align: 'center', priorite: 2, render: (centre) => <StatusBadge status={centre.principal ? 'PRINCIPAL' : 'AUXILIAIRE'} /> },
    { key: 'cleRepartition', label: 'Clé de répartition', numeric: true, nowrap: true, priorite: 2, render: (centre) => centre.principal ? Number(centre.cleRepartition || 0).toLocaleString('fr-FR') : '—' },
    ...(estControleur
      ? [{
        key: 'actions',
        label: 'Actions',
        actions: true,
        masquable: false,
        render: (centre) => (
          <MenuActionsLigne
            actions={[
              { label: 'Modifier', icone: 'editer', onSelect: () => ouvrirModification(centre), principale: true },
              { label: 'Supprimer', icone: 'supprimer', onSelect: () => setCentreASupprimer(centre), danger: true, separateurAvant: true },
            ]}
          />
        ),
      }]
      : []),
  ], [estControleur]);

  return (
    <section className="pile-large">
      <PageHeader title="Centres de coûts" description="Contrôle de gestion : unités organisationnelles pour l'imputation analytique." actions={estControleur && <Button onClick={ouvrirCreation}><Icone nom="plus" taille={18} /> Nouveau centre de coûts</Button>} />
      <AsyncState loading={chargement} error={erreur} onRetry={chargerCentres} empty={centres.length === 0} emptyTitle="Aucun centre de coûts configuré." emptyDescription="Définissez vos centres principaux et auxiliaires pour affecter les charges." emptyAction={estControleur && <Button onClick={ouvrirCreation}>Créer le premier centre</Button>}>
        <div className="panneau pile">
          <SearchToolbar value={recherche} onChange={setRecherche} placeholder="Rechercher par code ou libellé…" resultCount={`${centresVisibles.length} centre${centresVisibles.length > 1 ? 's' : ''}`} actions={<><BasculeDensite /><MenuColonnes storageKey="centres-cout" colonnes={columns} /></>} />
          <DataTable columns={columns} rows={centresVisibles} storageKey="centres-cout" empty="Aucun centre de coûts ne correspond à cette recherche." />
        </div>
      </AsyncState>
      <CrudModal open={modaleOuverte} onOpenChange={setModaleOuverte} title={centreEnCours ? 'Modifier le centre de coûts' : 'Nouveau centre de coûts'} footer={<><Button variant="secondary" type="button" onClick={() => setModaleOuverte(false)} disabled={chargementAction}>Annuler</Button><Button type="submit" form="centre-form" loading={chargementAction}>{centreEnCours ? 'Mettre à jour' : 'Créer le centre'}</Button></>}>
        <form id="centre-form" className="pile" onSubmit={enregistrer}>
          <Field id="centre-code" label="Code du centre" required error={erreursChamps.code} hint="De 2 à 10 caractères : majuscules, chiffres et tiret du bas.">{(props) => <input type="text" className="input" value={formulaire.code} onChange={(event) => setFormulaire({ ...formulaire, code: event.target.value.toUpperCase() })} maxLength={10} placeholder="Ex. PROD, ADM, COM…" {...props} />}</Field>
          {formulaire.principal && <Field id="centre-cle" label="Clé de répartition" error={erreursChamps.cleRepartition} hint="Poids utilisé pour répartir les charges auxiliaires.">{(props) => <input type="number" className="input" min="0" step="0.01" value={formulaire.cleRepartition} onChange={(event) => setFormulaire({ ...formulaire, cleRepartition: event.target.value })} {...props} />}</Field>}
          <Field id="centre-libelle" label="Libellé du centre" required error={erreursChamps.libelle}>{(props) => <input type="text" className="input" value={formulaire.libelle} onChange={(event) => setFormulaire({ ...formulaire, libelle: event.target.value })} maxLength={100} placeholder="Ex. Atelier de production…" {...props} />}</Field>
          <div className="ui-field"><span className="ui-field-label">Type de centre</span><div className="bascule bascule-modal"><button type="button" className={formulaire.principal ? 'actif' : ''} onClick={() => setFormulaire({ ...formulaire, principal: true })} aria-pressed={formulaire.principal}>Principal</button><button type="button" className={!formulaire.principal ? 'actif' : ''} onClick={() => setFormulaire({ ...formulaire, principal: false })} aria-pressed={!formulaire.principal}>Auxiliaire</button></div></div>
          {erreurModale && <p className="ui-field-error" role="alert">{erreurModale}</p>}
        </form>
      </CrudModal>
      <ConfirmDialog open={Boolean(centreASupprimer)} onOpenChange={(open) => { if (!open) setCentreASupprimer(null); }} title="Confirmer la suppression" description={centreASupprimer ? `Supprimer le centre « ${centreASupprimer.code} - ${centreASupprimer.libelle} » ? Cette action est irréversible.` : ''} confirmLabel="Supprimer définitivement" onConfirm={confirmerSuppression} loading={chargementAction} danger />
    </section>
  );
}