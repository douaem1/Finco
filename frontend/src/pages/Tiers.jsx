import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  listerFournisseurs, creerFournisseur, modifierFournisseur, supprimerFournisseur,
  listerClients, creerClient, modifierClient, supprimerClient,
} from '../services/tiersApi';
import { erreursParChamp, messageErreur } from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import AsyncState from '../components/ui/AsyncState';
import DataTable from '../components/ui/DataTable';
import SearchToolbar from '../components/ui/SearchToolbar';
import Amount from '../components/ui/Amount';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import CrudModal from '../components/ui/CrudModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import MessageErreur from '../components/MessageErreur';
import Icone from '../components/Icone';
import { useToast } from '../components/ui/ToastRegion';

const ONGLETS = [
  ['fournisseurs', 'Fournisseurs'],
  ['clients', 'Clients'],
];

export default function Tiers() {
  const { utilisateur } = useAuth();
  const { showToast } = useToast();
  const [onglet, setOnglet] = useState('fournisseurs'); // 'fournisseurs' | 'clients'

  // Données
  const [fournisseurs, setFournisseurs] = useState([]);
  const [clients, setClients] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [recherche, setRecherche] = useState('');

  // Modale édition / création
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [elementEnCours, setElementEnCours] = useState(null); // null = création
  const [formulaire, setFormulaire] = useState({
    nom: '', ice: '', email: '', telephone: '', rib: '', plafondCredit: '0.00',
  });
  const [erreursChamps, setErreursChamps] = useState({});
  const [erreurModale, setErreurModale] = useState('');
  const [chargementAction, setChargementAction] = useState(false);

  // Modale suppression
  const [elementASupprimer, setElementASupprimer] = useState(null);

  const peutModifier = utilisateur?.role === 'COMPTABLE';

  const estFournisseurs = onglet === 'fournisseurs';
  const typeSingulier = estFournisseurs ? 'fournisseur' : 'client';

  useEffect(() => {
    chargerDonnees();
  }, []);

  async function chargerDonnees() {
    setChargement(true);
    setErreur('');
    try {
      const [f, c] = await Promise.all([listerFournisseurs(), listerClients()]);
      setFournisseurs(f);
      setClients(c);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setChargement(false);
    }
  }

  function ouvrirCreation() {
    setElementEnCours(null);
    setFormulaire({
      nom: '', ice: '', email: '', telephone: '', rib: '', plafondCredit: '0.00',
    });
    setErreursChamps({});
    setErreurModale('');
    setModaleOuverte(true);
  }

  function ouvrirModification(item) {
    setElementEnCours(item);
    setFormulaire({
      nom: item.nom || '',
      ice: item.ice || '',
      email: item.email || '',
      telephone: item.telephone || '',
      rib: item.rib || '',
      plafondCredit: item.plafondCredit !== undefined ? String(item.plafondCredit) : '0.00',
    });
    setErreursChamps({});
    setErreurModale('');
    setModaleOuverte(true);
  }

  function validerFormulaire() {
    const errs = {};
    if (!formulaire.nom || !formulaire.nom.trim()) {
      errs.nom = 'Le nom est obligatoire.';
    } else if (formulaire.nom.trim().length > 150) {
      errs.nom = 'Le nom ne doit pas dépasser 150 caractères.';
    }

    // Aide à la saisie : mêmes règles que le serveur (qui reste seul juge).
    const iceSaisi = (formulaire.ice || '').replace(/[\s.-]/g, '');
    if (iceSaisi && !/^[0-9]{15}$/.test(iceSaisi)) {
      errs.ice = "L'ICE doit comporter exactement 15 chiffres.";
    }

    const telSaisi = (formulaire.telephone || '').replace(/[\s.-]/g, '').replace(/^00212/, '+212');
    if (telSaisi && !/^(\+212|0)[5-8][0-9]{8}$/.test(telSaisi)) {
      errs.telephone = 'Numéro marocain attendu : 10 chiffres commençant par 05, 06, 07 ou 08 (ou +212).';
    }

    if (formulaire.email && formulaire.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formulaire.email.trim())) {
        errs.email = "L'adresse email n'est pas valide.";
      }
    }

    if (estFournisseurs && formulaire.rib && formulaire.rib.trim()) {
      if (!/^[0-9]{24}$/.test(formulaire.rib.replace(/[\s.-]/g, ''))) {
        errs.rib = 'Le RIB doit comporter exactement 24 chiffres.';
      }
    }

    if (!estFournisseurs) {
      const plafond = Number(formulaire.plafondCredit);
      if (isNaN(plafond) || plafond < 0) {
        errs.plafondCredit = 'Le plafond de crédit doit être supérieur ou égal à zéro.';
      } else if (!/^\d+([.,]\d{1,2})?$/.test(String(formulaire.plafondCredit || '0').trim())) {
        errs.plafondCredit = 'Le plafond de crédit ne peut pas avoir plus de 2 décimales.';
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
      if (estFournisseurs) {
        const payload = {
          nom: formulaire.nom.trim(),
          ice: formulaire.ice.trim() || null,
          email: formulaire.email.trim() || null,
          telephone: formulaire.telephone.trim() || null,
          rib: formulaire.rib.trim() || null,
        };

        if (elementEnCours) {
          const modifie = await modifierFournisseur(elementEnCours.id, payload);
          setFournisseurs((prev) => prev.map((f) => (f.id === modifie.id ? modifie : f)));
          showToast(`Fournisseur « ${modifie.nom} » mis à jour avec succès.`);
        } else {
          const cree = await creerFournisseur(payload);
          setFournisseurs((prev) => [...prev, cree].sort((a, b) => a.nom.localeCompare(b.nom)));
          showToast(`Fournisseur « ${cree.nom} » créé avec succès.`);
        }
      } else {
        const payload = {
          nom: formulaire.nom.trim(),
          ice: formulaire.ice.trim() || null,
          email: formulaire.email.trim() || null,
          telephone: formulaire.telephone.trim() || null,
          plafondCredit: formulaire.plafondCredit ? Number(formulaire.plafondCredit) : 0,
        };

        if (elementEnCours) {
          const modifie = await modifierClient(elementEnCours.id, payload);
          setClients((prev) => prev.map((c) => (c.id === modifie.id ? modifie : c)));
          showToast(`Client « ${modifie.nom} » mis à jour avec succès.`);
        } else {
          const cree = await creerClient(payload);
          setClients((prev) => [...prev, cree].sort((a, b) => a.nom.localeCompare(b.nom)));
          showToast(`Client « ${cree.nom} » créé avec succès.`);
        }
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
      if (estFournisseurs) {
        await supprimerFournisseur(elementASupprimer.id);
        setFournisseurs((prev) => prev.filter((f) => f.id !== elementASupprimer.id));
        showToast(`Fournisseur « ${elementASupprimer.nom} » supprimé avec succès.`);
      } else {
        await supprimerClient(elementASupprimer.id);
        setClients((prev) => prev.filter((c) => c.id !== elementASupprimer.id));
        showToast(`Client « ${elementASupprimer.nom} » supprimé avec succès.`);
      }
      setElementASupprimer(null);
    } catch (err) {
      showToast(messageErreur(err), 'error');
      setElementASupprimer(null);
    } finally {
      setChargementAction(false);
    }
  }

  const filtre = recherche.trim().toLowerCase();
  const listeActive = estFournisseurs ? fournisseurs : clients;
  const donneesVisibles = useMemo(() => {
    return listeActive.filter((item) => {
      if (!filtre) return true;
      return (
        item.nom?.toLowerCase().includes(filtre) ||
        item.ice?.toLowerCase().includes(filtre) ||
        item.email?.toLowerCase().includes(filtre)
      );
    });
  }, [listeActive, filtre]);

  const colonnes = [
    { key: 'nom', label: 'Nom', sortable: true, render: (item) => <strong>{item.nom}</strong> },
    { key: 'ice', label: 'ICE', render: (item) => <span className="chiffres">{item.ice || '—'}</span> },
    { key: 'email', label: 'Email', render: (item) => item.email || '—' },
    { key: 'telephone', label: 'Téléphone', render: (item) => item.telephone || '—' },
    estFournisseurs
      ? { key: 'rib', label: 'RIB bancaire', render: (item) => (item.rib ? <span className="badge-rib">{item.rib}</span> : '—') }
      : { key: 'plafondCredit', label: 'Plafond crédit (MAD)', numeric: true, render: (item) => <Amount value={item.plafondCredit} /> },
    ...(peutModifier ? [{
      key: 'actions',
      label: 'Actions',
      render: (item) => (
        <div className="actions-cell">
          <button type="button" className="btn-action" onClick={() => ouvrirModification(item)} title="Modifier" aria-label="Modifier">
            <Icone nom="editer" taille={16} />
          </button>
          <button type="button" className="btn-action btn-action-supprimer" onClick={() => setElementASupprimer(item)} title="Supprimer" aria-label="Supprimer">
            <Icone nom="supprimer" taille={16} />
          </button>
        </div>
      ),
    }] : []),
  ];

  return (
    <section>
      <PageHeader
        title="Gestion des tiers"
        description="Référentiel des partenaires commerciaux : fournisseurs et clients."
        actions={peutModifier && (
          <Button type="button" onClick={ouvrirCreation}>
            <Icone nom="plus" taille={18} />
            {estFournisseurs ? 'Nouveau fournisseur' : 'Nouveau client'}
          </Button>
        )}
      />

      <div className="onglets-statut" role="tablist" aria-label="Type de tiers">
        {ONGLETS.map(([code, libelle]) => (
          <button
            key={code}
            type="button"
            role="tab"
            aria-selected={onglet === code}
            className={`onglet-statut ${onglet === code ? 'actif' : ''}`}
            onClick={() => { setOnglet(code); setRecherche(''); }}
          >
            {libelle}<span className="onglet-compte">{code === 'fournisseurs' ? fournisseurs.length : clients.length}</span>
          </button>
        ))}
      </div>

      <AsyncState
        loading={chargement}
        error={erreur}
        onRetry={chargerDonnees}
        empty={listeActive.length === 0}
        emptyTitle={`Aucun ${typeSingulier} pour l'instant.`}
        emptyDescription={estFournisseurs
          ? 'Ajoutez vos fournisseurs pour enregistrer leurs factures et règlements.'
          : 'Ajoutez vos clients pour émettre des factures et gérer leur encaissement.'}
        emptyAction={peutModifier && (
          <Button type="button" onClick={ouvrirCreation}>Créer le premier {typeSingulier}</Button>
        )}
      >
        <div className="panneau">
          <SearchToolbar
            value={recherche}
            onChange={setRecherche}
            placeholder={`Rechercher un ${typeSingulier} par nom, ICE ou email…`}
            resultCount={`${donneesVisibles.length} ${typeSingulier}${donneesVisibles.length > 1 ? 's' : ''}`}
          />
          <DataTable columns={colonnes} rows={donneesVisibles} empty={`Aucun résultat correspondant à « ${recherche} ».`} />
        </div>
      </AsyncState>

      <CrudModal
        open={modaleOuverte}
        onOpenChange={setModaleOuverte}
        title={elementEnCours ? `Modifier le ${typeSingulier}` : `Nouveau ${typeSingulier}`}
        footer={(
          <>
            <Button variant="secondary" type="button" onClick={() => setModaleOuverte(false)}>Annuler</Button>
            <Button type="submit" form="formulaire-tiers" loading={chargementAction}>
              {chargementAction ? 'Enregistrement…' : elementEnCours ? 'Mettre à jour' : 'Créer'}
            </Button>
          </>
        )}
      >
        <MessageErreur message={erreurModale} onFermer={() => setErreurModale('')} />
        <form id="formulaire-tiers" className="pile" onSubmit={enregistrer}>
          <Field id="tiers-nom" label="Raison sociale / Nom complet" required error={erreursChamps.nom}>
            {(p) => (
              <input
                className="input"
                type="text"
                value={formulaire.nom}
                onChange={(e) => setFormulaire({ ...formulaire, nom: e.target.value })}
                placeholder="Ex. Maroc Telecom, Atlas Distribution..."
                maxLength={150}
                {...p}
              />
            )}
          </Field>

          <Field
            id="tiers-ice"
            label="Identifiant Commun de l'Entreprise (ICE)"
            error={erreursChamps.ice}
            hint={`Facultatif — exactement 15 chiffres, unique par ${typeSingulier}.`}
          >
            {(p) => (
              <input
                className="input"
                type="text"
                value={formulaire.ice}
                onChange={(e) => setFormulaire({ ...formulaire, ice: e.target.value })}
                placeholder="15 chiffres (ex. 001524368000085)"
                inputMode="numeric"
                maxLength={20}
                {...p}
              />
            )}
          </Field>

          <Field id="tiers-email" label="Adresse e-mail" error={erreursChamps.email}>
            {(p) => (
              <input
                className="input"
                type="email"
                value={formulaire.email}
                onChange={(e) => setFormulaire({ ...formulaire, email: e.target.value })}
                placeholder="contact@societe.ma"
                maxLength={100}
                {...p}
              />
            )}
          </Field>

          <Field
            id="tiers-telephone"
            label="Numéro de téléphone"
            error={erreursChamps.telephone}
            hint="Facultatif — 05, 06, 07 ou 08 suivi de 8 chiffres, ou +212."
          >
            {(p) => (
              <input
                className="input"
                type="tel"
                value={formulaire.telephone}
                onChange={(e) => setFormulaire({ ...formulaire, telephone: e.target.value })}
                placeholder="05 22 00 00 00"
                inputMode="tel"
                maxLength={20}
                {...p}
              />
            )}
          </Field>

          {estFournisseurs ? (
            <Field
              id="tiers-rib"
              label="Relevé d'Identité Bancaire (RIB - 24 chiffres)"
              error={erreursChamps.rib}
              hint="Compte bancaire marocain à 24 chiffres."
            >
              {(p) => (
                <input
                  className="input"
                  type="text"
                  value={formulaire.rib}
                  onChange={(e) => setFormulaire({ ...formulaire, rib: e.target.value })}
                  placeholder="Ex. 011780000012345678901234"
                  inputMode="numeric"
                  maxLength={30}
                  {...p}
                />
              )}
            </Field>
          ) : (
            <Field id="tiers-plafond" label="Plafond de crédit autorisé (MAD)" error={erreursChamps.plafondCredit}>
              {(p) => (
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formulaire.plafondCredit}
                  onChange={(e) => setFormulaire({ ...formulaire, plafondCredit: e.target.value })}
                  placeholder="0.00"
                  {...p}
                />
              )}
            </Field>
          )}
        </form>
      </CrudModal>

      <ConfirmDialog
        open={Boolean(elementASupprimer)}
        onOpenChange={(o) => !o && setElementASupprimer(null)}
        title={`Supprimer le ${typeSingulier}`}
        description={elementASupprimer
          ? `Supprimer le ${typeSingulier} « ${elementASupprimer.nom} » ? Cette action est irréversible. La suppression sera automatiquement refusée par le serveur si ce tiers possède des factures associées.`
          : ''}
        confirmLabel="Supprimer définitivement"
        danger
        loading={chargementAction}
        onConfirm={confirmerSuppression}
      />
    </section>
  );
}
