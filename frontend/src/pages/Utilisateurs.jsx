import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { creerUtilisateur, listerUtilisateurs, modifierUtilisateur, supprimerUtilisateur } from '../services/utilisateurApi';
import { erreursParChamp, messageErreur } from '../services/api';
import { LIBELLES_ROLES } from '../utils/format';
import MessageErreur from '../components/MessageErreur';
import Icone from '../components/Icone';
import PageHeader from '../components/ui/PageHeader';
import AsyncState from '../components/ui/AsyncState';
import DataTable from '../components/ui/DataTable';
import SearchToolbar from '../components/ui/SearchToolbar';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import CrudModal from '../components/ui/CrudModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useToast } from '../components/ui/ToastRegion';

const OPTIONS_ROLES = Object.entries(LIBELLES_ROLES).map(([value, label]) => ({ value, label }));

const roleLabel = (role) => LIBELLES_ROLES[role] || role;

export default function Utilisateurs() {
  const { utilisateur: utilisateurConnecte } = useAuth();
  const { showToast } = useToast();
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [recherche, setRecherche] = useState('');
  const [modale, setModale] = useState(false);
  const [enCours, setEnCours] = useState(null);
  const [aSupprimer, setASupprimer] = useState(null);
  const [formulaire, setFormulaire] = useState({ nom: '', prenom: '', email: '', motDePasse: '', role: 'COMPTABLE', actif: true });
  const [erreursChamps, setErreursChamps] = useState({});
  const [erreurModale, setErreurModale] = useState('');
  const [action, setAction] = useState(false);

  useEffect(() => { charger(); }, []);

  async function charger() {
    setChargement(true);
    setErreur('');
    try { setUtilisateurs(await listerUtilisateurs()); }
    catch (e) { setErreur(messageErreur(e)); }
    finally { setChargement(false); }
  }

  function ouvrirCreation() {
    setEnCours(null);
    setFormulaire({ nom: '', prenom: '', email: '', motDePasse: '', role: 'COMPTABLE', actif: true });
    setErreursChamps({});
    setErreurModale('');
    setModale(true);
  }

  function ouvrirModification(u) {
    setEnCours(u);
    setFormulaire({ nom: u.nom, prenom: u.prenom, email: u.email, motDePasse: '', role: u.role, actif: u.actif });
    setErreursChamps({});
    setErreurModale('');
    setModale(true);
  }

  function valider() {
    const errs = {};
    if (!formulaire.nom.trim()) errs.nom = 'Le nom est obligatoire.';
    if (!formulaire.prenom.trim()) errs.prenom = 'Le prénom est obligatoire.';
    if (!formulaire.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulaire.email.trim())) errs.email = 'Adresse email invalide.';
    if (!enCours && formulaire.motDePasse.length < 8) errs.motDePasse = 'Le mot de passe doit comporter au moins 8 caractères.';
    if (enCours && formulaire.motDePasse && formulaire.motDePasse.length < 8) errs.motDePasse = 'Le mot de passe doit comporter au moins 8 caractères.';
    setErreursChamps(errs);
    return Object.keys(errs).length === 0;
  }

  async function enregistrer(event) {
    event.preventDefault();
    if (!valider()) return;
    setAction(true); setErreurModale('');
    const payload = { ...formulaire, nom: formulaire.nom.trim(), prenom: formulaire.prenom.trim(), email: formulaire.email.trim().toLowerCase() };
    if (!payload.motDePasse) delete payload.motDePasse;
    try {
      if (enCours) {
        const maj = await modifierUtilisateur(enCours.id, payload);
        setUtilisateurs((prev) => prev.map((u) => (u.id === maj.id ? maj : u)));
        showToast(`Utilisateur « ${maj.prenom} ${maj.nom} » mis à jour avec succès.`);
      } else {
        const cree = await creerUtilisateur(payload);
        setUtilisateurs((prev) => [...prev, cree].sort((a, b) => a.nom.localeCompare(b.nom)));
        showToast(`Utilisateur « ${cree.prenom} ${cree.nom} » créé avec succès.`);
      }
      setModale(false);
    } catch (e) {
      setErreursChamps((prev) => ({ ...prev, ...erreursParChamp(e) }));
      setErreurModale(messageErreur(e));
    } finally { setAction(false); }
  }

  async function confirmerSuppression() {
    if (!aSupprimer) return;
    setAction(true);
    try {
      await supprimerUtilisateur(aSupprimer.id);
      setUtilisateurs((prev) => prev.filter((u) => u.id !== aSupprimer.id));
      showToast(`Utilisateur « ${aSupprimer.prenom} ${aSupprimer.nom} » supprimé.`);
      setASupprimer(null);
    } catch (e) { showToast(messageErreur(e), 'error'); setASupprimer(null); }
    finally { setAction(false); }
  }

  const filtre = recherche.trim().toLowerCase();
  const visibles = useMemo(() => utilisateurs.filter((u) => !filtre || `${u.nom} ${u.prenom} ${u.email} ${u.role}`.toLowerCase().includes(filtre)), [utilisateurs, filtre]);

  const colonnes = [
    { key: 'nom', label: 'Utilisateur', sortable: true, render: (u) => <strong>{u.prenom} {u.nom}</strong> },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'role', label: 'Rôle', render: (u) => roleLabel(u.role) },
    { key: 'actif', label: 'Statut', render: (u) => <StatusBadge status={u.actif ? 'OUVERT' : 'CLOTURE'} label={u.actif ? 'Actif' : 'Désactivé'} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (u) => (
        <div className="actions-cell">
          <button type="button" className="btn-action" onClick={() => ouvrirModification(u)} title="Modifier" aria-label={`Modifier ${u.prenom} ${u.nom}`}><Icone nom="editer" taille={16} /></button>
          <button type="button" className="btn-action btn-action-supprimer" onClick={() => setASupprimer(u)} disabled={u.email === utilisateurConnecte?.email} title={u.email === utilisateurConnecte?.email ? 'Votre compte ne peut pas être supprimé' : 'Supprimer'} aria-label={`Supprimer ${u.prenom} ${u.nom}`}><Icone nom="supprimer" taille={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <section className="pile-large">
      <PageHeader
        title="Gestion des utilisateurs"
        description="Gérez les comptes, les rôles et l’accès à FinCo."
        actions={<Button type="button" onClick={ouvrirCreation}><Icone nom="plus" taille={18} /> Nouvel utilisateur</Button>}
      />
      <AsyncState loading={chargement} error={erreur} onRetry={charger}>
        <div className="panneau pile">
          <SearchToolbar value={recherche} onChange={setRecherche} placeholder="Rechercher par nom, email ou rôle…" resultCount={`${visibles.length} utilisateur${visibles.length > 1 ? 's' : ''}`} />
          <DataTable columns={colonnes} rows={visibles} empty="Aucun utilisateur ne correspond à cette recherche." />
        </div>
      </AsyncState>

      <CrudModal
        open={modale}
        onOpenChange={setModale}
        title={enCours ? 'Modifier un utilisateur' : 'Nouvel utilisateur'}
        footer={(
          <>
            <Button variant="secondary" type="button" onClick={() => setModale(false)} disabled={action}>Annuler</Button>
            <Button type="submit" form="formulaire-utilisateur" loading={action}>{enCours ? 'Mettre à jour' : 'Créer l’utilisateur'}</Button>
          </>
        )}
      >
        <MessageErreur message={erreurModale} />
        <form id="formulaire-utilisateur" className="pile" onSubmit={enregistrer}>
          <div className="grille-formulaire">
            <Field id="utilisateur-prenom" label="Prénom" required error={erreursChamps.prenom}>
              {(props) => <input className="input" type="text" maxLength={100} value={formulaire.prenom} onChange={(e) => setFormulaire({ ...formulaire, prenom: e.target.value })} {...props} />}
            </Field>
            <Field id="utilisateur-nom" label="Nom" required error={erreursChamps.nom}>
              {(props) => <input className="input" type="text" maxLength={100} value={formulaire.nom} onChange={(e) => setFormulaire({ ...formulaire, nom: e.target.value })} {...props} />}
            </Field>
          </div>
          <Field id="utilisateur-email" label="Email" required error={erreursChamps.email}>
            {(props) => <input className="input" type="email" maxLength={150} value={formulaire.email} onChange={(e) => setFormulaire({ ...formulaire, email: e.target.value })} {...props} />}
          </Field>
          <Field id="utilisateur-motDePasse" label={enCours ? 'Nouveau mot de passe (facultatif)' : 'Mot de passe'} error={erreursChamps.motDePasse}>
            {(props) => <input className="input" type="password" maxLength={100} value={formulaire.motDePasse} onChange={(e) => setFormulaire({ ...formulaire, motDePasse: e.target.value })} {...props} />}
          </Field>
          <Field id="utilisateur-role" label="Rôle">
            {(props) => <select className="input" value={formulaire.role} onChange={(e) => setFormulaire({ ...formulaire, role: e.target.value })} {...props}>{OPTIONS_ROLES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>}
          </Field>
          <label className="case-a-cocher"><input type="checkbox" checked={formulaire.actif} onChange={(e) => setFormulaire({ ...formulaire, actif: e.target.checked })} /> Compte actif</label>
        </form>
      </CrudModal>

      <ConfirmDialog
        open={Boolean(aSupprimer)}
        onOpenChange={(ouvert) => { if (!ouvert) setASupprimer(null); }}
        title="Confirmer la suppression"
        description={aSupprimer ? `Supprimer définitivement « ${aSupprimer.prenom} ${aSupprimer.nom} » ? La suppression est refusée si cet utilisateur a déjà saisi une pièce comptable. Dans ce cas, désactivez son compte.` : ''}
        confirmLabel="Supprimer définitivement"
        danger
        loading={action}
        onConfirm={confirmerSuppression}
      />
    </section>
  );
}
