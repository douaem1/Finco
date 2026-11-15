import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { listerComptes, creerCompte, modifierCompte, supprimerCompte } from '../services/compteApi';
import { erreursParChamp, messageErreur } from '../services/api';
import PageHeader from '../components/ui/PageHeader';
import AsyncState from '../components/ui/AsyncState';
import DataTable, { BasculeDensite, MenuColonnes, MenuActionsLigne } from '../components/ui/DataTable';
import SearchToolbar from '../components/ui/SearchToolbar';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import CrudModal from '../components/ui/CrudModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import MessageErreur from '../components/MessageErreur';
import Icone from '../components/Icone';
import { useToast } from '../components/ui/ToastRegion';

const NOMS_CLASSES = {
  1: 'Comptes de financement permanent',
  2: 'Comptes d’actif immobilisé',
  3: 'Comptes d’actif circulant (hors trésorerie)',
  4: 'Comptes de passif circulant (hors trésorerie)',
  5: 'Comptes de trésorerie',
  6: 'Comptes de charges',
  7: 'Comptes de produits',
  8: 'Comptes de résultats',
};

export default function PlanComptable() {
  const { utilisateur } = useAuth();
  const { showToast } = useToast();
  const [comptes, setComptes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [recherche, setRecherche] = useState('');

  // Modale édition / création
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [compteEnCours, setCompteEnCours] = useState(null); // null = création
  const [formulaire, setFormulaire] = useState({ numero: '', libelle: '' });
  const [erreursChamps, setErreursChamps] = useState({});
  const [erreurModale, setErreurModale] = useState('');
  const [chargementAction, setChargementAction] = useState(false);

  // Modale suppression
  const [compteASupprimer, setCompteASupprimer] = useState(null);

  const estAdmin = utilisateur?.role === 'ADMIN';

  useEffect(() => {
    chargerComptes();
  }, []);

  async function chargerComptes() {
    setChargement(true);
    setErreur('');
    try {
      const data = await listerComptes();
      setComptes(data);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setChargement(false);
    }
  }

  function ouvrirCreation() {
    setCompteEnCours(null);
    setFormulaire({ numero: '', libelle: '' });
    setErreursChamps({});
    setErreurModale('');
    setModaleOuverte(true);
  }

  function ouvrirModification(c) {
    setCompteEnCours(c);
    setFormulaire({ numero: c.numero, libelle: c.libelle });
    setErreursChamps({});
    setErreurModale('');
    setModaleOuverte(true);
  }

  function validerFormulaire() {
    const errs = {};
    const num = formulaire.numero.trim();
    if (!num) {
      errs.numero = 'Le numéro de compte est obligatoire.';
    } else if (!/^[1-8][0-9]{1,9}$/.test(num)) {
      errs.numero = 'Le numéro doit comporter de 2 à 10 chiffres et commencer par un chiffre entre 1 et 8.';
    }

    const lib = formulaire.libelle.trim();
    if (!lib) {
      errs.libelle = 'Le libellé du compte est obligatoire.';
    } else if (lib.length > 150) {
      errs.libelle = 'Le libellé ne doit pas dépasser 150 caractères.';
    }

    setErreursChamps(errs);
    return Object.keys(errs).length === 0;
  }

  async function enregistrer(e) {
    e.preventDefault();
    if (!validerFormulaire()) return;

    setChargementAction(true);
    setErreurModale('');

    const payload = {
      numero: formulaire.numero.trim(),
      libelle: formulaire.libelle.trim(),
    };

    try {
      if (compteEnCours) {
        const modifie = await modifierCompte(compteEnCours.id, payload);
        setComptes((prev) => prev.map((c) => (c.id === modifie.id ? modifie : c)));
        showToast(`Compte « ${modifie.numero} - ${modifie.libelle} » mis à jour avec succès.`);
      } else {
        const cree = await creerCompte(payload);
        setComptes((prev) => [...prev, cree].sort((a, b) => a.numero.localeCompare(b.numero)));
        showToast(`Compte « ${cree.numero} - ${cree.libelle} » créé avec succès (Classe ${cree.classe}).`);
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
    if (!compteASupprimer) return;
    setChargementAction(true);

    try {
      await supprimerCompte(compteASupprimer.id);
      setComptes((prev) => prev.filter((c) => c.id !== compteASupprimer.id));
      showToast(`Compte « ${compteASupprimer.numero} - ${compteASupprimer.libelle} » supprimé avec succès.`);
      setCompteASupprimer(null);
    } catch (err) {
      showToast(messageErreur(err), 'error');
      setCompteASupprimer(null);
    } finally {
      setChargementAction(false);
    }
  }

  const filtre = recherche.trim().toLowerCase();
  const comptesVisibles = useMemo(() => {
    return comptes.filter((c) => {
      if (!filtre) return true;
      return (
        c.numero.toLowerCase().includes(filtre) ||
        c.libelle.toLowerCase().includes(filtre)
      );
    });
  }, [comptes, filtre]);

  // Estimation de classe en temps réel pour l'aperçu utilisateur
  const premierChiffre = formulaire.numero.trim().charAt(0);
  const classeCalculee = /^[1-8]$/.test(premierChiffre) ? Number(premierChiffre) : null;

  const colonnes = [
    { key: 'numero', label: 'Numéro', sortable: true, priorite: 1, render: (c) => <strong className="numero-compte">{c.numero}</strong> },
    { key: 'libelle', label: 'Libellé', sortable: true, priorite: 1, truncate: true },
    {
      key: 'classe',
      label: 'Classe',
      priorite: 2,
      align: 'center',
      render: (c) => (
        <span className="badge badge-classe" title={NOMS_CLASSES[c.classe] || ''}>Classe {c.classe}</span>
      ),
    },
    ...(estAdmin ? [{
      key: 'actions',
      label: 'Actions',
      actions: true,
      masquable: false,
      render: (c) => (
        <MenuActionsLigne
          label="Actions pour ce compte"
          actions={[
            { label: 'Modifier', icone: 'editer', principale: true, onSelect: () => ouvrirModification(c) },
            { label: 'Supprimer', icone: 'supprimer', danger: true, separateurAvant: true, onSelect: () => setCompteASupprimer(c) },
          ]}
        />
      ),
    }] : []),
  ];

  return (
    <section>
      <PageHeader
        title="Plan comptable général (CGNC)"
        description="Nomenclature officielle des comptes généraux de l’entreprise."
        actions={estAdmin && (
          <Button type="button" onClick={ouvrirCreation}>
            <Icone nom="plus" taille={18} /> Nouveau compte
          </Button>
        )}
      />

      <AsyncState
        loading={chargement}
        error={erreur}
        onRetry={chargerComptes}
        empty={comptes.length === 0}
        emptyTitle="Aucun compte dans le plan comptable."
        emptyDescription="Ajoutez les comptes nécessaires à la comptabilisation des opérations."
        emptyAction={estAdmin && (
          <Button type="button" onClick={ouvrirCreation}>Créer le premier compte</Button>
        )}
      >
        <div className="panneau">
          <SearchToolbar
            value={recherche}
            onChange={setRecherche}
            placeholder="Rechercher par numéro ou libellé…"
            resultCount={`${comptesVisibles.length} compte${comptesVisibles.length > 1 ? 's' : ''}`}
            actions={<><BasculeDensite /><MenuColonnes storageKey="plan-comptable" colonnes={colonnes} /></>}
          />
          <DataTable columns={colonnes} rows={comptesVisibles} storageKey="plan-comptable" empty={`Aucun compte ne correspond à « ${recherche} ».`} />
        </div>
      </AsyncState>

      <CrudModal
        open={modaleOuverte}
        onOpenChange={setModaleOuverte}
        title={compteEnCours ? 'Modifier le compte général' : 'Nouveau compte général'}
        footer={(
          <>
            <Button variant="secondary" type="button" onClick={() => setModaleOuverte(false)}>Annuler</Button>
            <Button type="submit" form="formulaire-compte" loading={chargementAction}>
              {chargementAction ? 'Enregistrement…' : compteEnCours ? 'Mettre à jour' : 'Créer le compte'}
            </Button>
          </>
        )}
      >
        <MessageErreur message={erreurModale} onFermer={() => setErreurModale('')} />
        <form id="formulaire-compte" className="pile" onSubmit={enregistrer}>
          <Field
            id="compte-numero"
            label="Numéro de compte"
            required
            error={erreursChamps.numero}
            hint="De 2 à 10 chiffres. Le 1er chiffre (1 à 8) détermine automatiquement la classe du compte."
          >
            {(p) => (
              <input
                className="input"
                type="text"
                value={formulaire.numero}
                onChange={(e) => setFormulaire({ ...formulaire, numero: e.target.value })}
                placeholder="Ex. 6111, 4411, 3421..."
                inputMode="numeric"
                maxLength={10}
                {...p}
              />
            )}
          </Field>

          {classeCalculee && (
            <div className="encart-compte">
              <p className="encart-compte-titre">
                Classe calculée : <span className="badge badge-classe">Classe {classeCalculee}</span>
              </p>
              <p className="texte-secondaire encart-compte-aide">
                {NOMS_CLASSES[classeCalculee]}
              </p>
            </div>
          )}

          <Field id="compte-libelle" label="Libellé du compte" required error={erreursChamps.libelle}>
            {(p) => (
              <input
                className="input"
                type="text"
                value={formulaire.libelle}
                onChange={(e) => setFormulaire({ ...formulaire, libelle: e.target.value })}
                placeholder="Ex. Achats de marchandises, Fournisseurs..."
                maxLength={150}
                {...p}
              />
            )}
          </Field>
        </form>
      </CrudModal>

      <ConfirmDialog
        open={Boolean(compteASupprimer)}
        onOpenChange={(o) => !o && setCompteASupprimer(null)}
        title="Supprimer le compte"
        description={compteASupprimer
          ? `Supprimer le compte « ${compteASupprimer.numero} - ${compteASupprimer.libelle} » ? Cette action est irréversible. La suppression sera automatiquement refusée par le serveur si ce compte est déjà utilisé dans au moins une ligne d'écriture comptable.`
          : ''}
        confirmLabel="Supprimer définitivement"
        danger
        loading={chargementAction}
        onConfirm={confirmerSuppression}
      />
    </section>
  );
}
