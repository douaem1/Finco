import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { creerUtilisateur, listerUtilisateurs, modifierUtilisateur, supprimerUtilisateur } from '../services/utilisateurApi';
import { erreursParChamp, messageErreur } from '../services/api';
import MessageErreur from '../components/MessageErreur';
import Chargement from '../components/Chargement';
import Icone from '../components/Icone';

const ROLES = [
  ['COMPTABLE', 'Comptable'],
  ['CONTROLEUR', 'Contrôleur de gestion'],
  ['DIRECTEUR_FINANCIER', 'Directeur financier'],
  ['ADMIN', 'Administrateur'],
];

const roleLabel = (role) => ROLES.find(([code]) => code === role)?.[1] || role;

export default function Utilisateurs() {
  const { utilisateur: utilisateurConnecte } = useAuth();
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');
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
    setAction(true); setErreurModale(''); setSucces('');
    const payload = { ...formulaire, nom: formulaire.nom.trim(), prenom: formulaire.prenom.trim(), email: formulaire.email.trim().toLowerCase() };
    if (!payload.motDePasse) delete payload.motDePasse;
    try {
      if (enCours) {
        const maj = await modifierUtilisateur(enCours.id, payload);
        setUtilisateurs((prev) => prev.map((u) => (u.id === maj.id ? maj : u)));
        setSucces(`Utilisateur « ${maj.prenom} ${maj.nom} » mis à jour avec succès.`);
      } else {
        const cree = await creerUtilisateur(payload);
        setUtilisateurs((prev) => [...prev, cree].sort((a, b) => a.nom.localeCompare(b.nom)));
        setSucces(`Utilisateur « ${cree.prenom} ${cree.nom} » créé avec succès.`);
      }
      setModale(false);
    } catch (e) {
      setErreursChamps((prev) => ({ ...prev, ...erreursParChamp(e) }));
      setErreurModale(messageErreur(e));
    } finally { setAction(false); }
  }

  async function confirmerSuppression() {
    if (!aSupprimer) return;
    setAction(true); setErreur('');
    try {
      await supprimerUtilisateur(aSupprimer.id);
      setUtilisateurs((prev) => prev.filter((u) => u.id !== aSupprimer.id));
      setSucces(`Utilisateur « ${aSupprimer.prenom} ${aSupprimer.nom} » supprimé.`);
      setASupprimer(null);
    } catch (e) { setErreur(messageErreur(e)); setASupprimer(null); }
    finally { setAction(false); }
  }

  const filtre = recherche.trim().toLowerCase();
  const visibles = useMemo(() => utilisateurs.filter((u) => !filtre || `${u.nom} ${u.prenom} ${u.email} ${u.role}`.toLowerCase().includes(filtre)), [utilisateurs, filtre]);

  return (
    <section>
      <header className="entete-page">
        <div><h1>Gestion des utilisateurs</h1><p className="texte-secondaire">Gérez les comptes, les rôles et l’accès à FinCo.</p></div>
        <button type="button" className="btn btn-primaire" onClick={ouvrirCreation}><Icone nom="plus" taille={18} /> Nouvel utilisateur</button>
      </header>
      {succes && <p className="message-succes" role="status">{succes}</p>}
      <MessageErreur message={erreur} />
      {chargement ? <Chargement /> : (
        <div className="panneau">
          <div className="barre-outils">
            <label className="recherche"><Icone nom="recherche" taille={18} /><input type="search" placeholder="Rechercher par nom, email ou rôle..." value={recherche} onChange={(e) => setRecherche(e.target.value)} aria-label="Rechercher un utilisateur" /></label>
            <span className="texte-secondaire">{visibles.length} utilisateur{visibles.length > 1 ? 's' : ''}</span>
          </div>
          <div className="defilement"><table className="tableau"><thead><tr><th>Utilisateur</th><th>Email</th><th>Rôle</th><th>Statut</th><th style={{ width: '110px', textAlign: 'center' }}>Actions</th></tr></thead>
            <tbody>{visibles.map((u) => <tr key={u.id}><td><strong>{u.prenom} {u.nom}</strong></td><td>{u.email}</td><td><span className="badge badge-classe">{roleLabel(u.role)}</span></td><td><span className={`badge ${u.actif ? 'badge-succes' : 'badge-inactif'}`}>{u.actif ? 'Actif' : 'Désactivé'}</span></td><td><div className="actions-cell"><button type="button" className="btn-action" onClick={() => ouvrirModification(u)} title="Modifier"><Icone nom="editer" taille={16} /></button><button type="button" className="btn-action btn-action-supprimer" onClick={() => setASupprimer(u)} disabled={u.email === utilisateurConnecte?.email} title={u.email === utilisateurConnecte?.email ? 'Votre compte ne peut pas être supprimé' : 'Supprimer'}><Icone nom="supprimer" taille={16} /></button></div></td></tr>)}</tbody>
          </table></div>
        </div>
      )}
      {modale && <div className="modale-fond" onClick={() => setModale(false)}><div className="modale-boite" onClick={(e) => e.stopPropagation()}><div className="modale-entete"><h2>{enCours ? 'Modifier un utilisateur' : 'Nouvel utilisateur'}</h2><button type="button" className="bouton-icone" onClick={() => setModale(false)}><Icone nom="croix" taille={18} /></button></div><form onSubmit={enregistrer}><div className="modale-corps"><MessageErreur message={erreurModale} /><div className="grille-formulaire"><Champ id="prenom" label="Prénom" value={formulaire.prenom} erreur={erreursChamps.prenom} onChange={(v) => setFormulaire({ ...formulaire, prenom: v })} /><Champ id="nom" label="Nom" value={formulaire.nom} erreur={erreursChamps.nom} onChange={(v) => setFormulaire({ ...formulaire, nom: v })} /></div><Champ id="email" label="Email" type="email" value={formulaire.email} erreur={erreursChamps.email} onChange={(v) => setFormulaire({ ...formulaire, email: v })} /><Champ id="motDePasse" label={enCours ? 'Nouveau mot de passe (facultatif)' : 'Mot de passe'} type="password" value={formulaire.motDePasse} erreur={erreursChamps.motDePasse} onChange={(v) => setFormulaire({ ...formulaire, motDePasse: v })} /><div className="champ"><label className="champ-label" htmlFor="role">Rôle</label><select id="role" className="input" value={formulaire.role} onChange={(e) => setFormulaire({ ...formulaire, role: e.target.value })}>{ROLES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></div><label className="case-a-cocher"><input type="checkbox" checked={formulaire.actif} onChange={(e) => setFormulaire({ ...formulaire, actif: e.target.checked })} /> Compte actif</label></div><div className="modale-pied"><button type="button" className="btn btn-secondaire" onClick={() => setModale(false)}>Annuler</button><button type="submit" className="btn btn-primaire" disabled={action}>{action ? 'Enregistrement...' : enCours ? 'Mettre à jour' : 'Créer l’utilisateur'}</button></div></form></div></div>}
      {aSupprimer && <div className="modale-fond" onClick={() => setASupprimer(null)}><div className="modale-boite" onClick={(e) => e.stopPropagation()}><div className="modale-entete"><h2>Confirmer la suppression</h2><button type="button" className="bouton-icone" onClick={() => setASupprimer(null)}><Icone nom="croix" taille={18} /></button></div><div className="modale-corps"><p>Supprimer définitivement <strong>« {aSupprimer.prenom} {aSupprimer.nom} »</strong> ?</p><p className="texte-secondaire">La suppression est refusée si cet utilisateur a déjà saisi une pièce comptable. Dans ce cas, désactivez son compte.</p></div><div className="modale-pied"><button type="button" className="btn btn-secondaire" onClick={() => setASupprimer(null)}>Annuler</button><button type="button" className="btn btn-primaire" onClick={confirmerSuppression} disabled={action}>Supprimer définitivement</button></div></div></div>}
    </section>
  );
}

function Champ({ id, label, type = 'text', value, erreur, onChange }) {
  return <div className="champ"><label className="champ-label" htmlFor={id}>{label}</label><input id={id} type={type} className={`input ${erreur ? 'input-erreur' : ''}`} value={value} onChange={(e) => onChange(e.target.value)} maxLength={type === 'email' ? 150 : 100} required={id !== 'motDePasse'} />{erreur && <span className="champ-erreur">{erreur}</span>}</div>;
}
