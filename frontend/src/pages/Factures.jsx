import { useEffect, useMemo, useState } from 'react';
import {
  creerFacture, listerFactures, modifierFacture, supprimerFacture, validerFacture,
} from '../services/factureApi';
import { listerFournisseurs, listerClients } from '../services/tiersApi';
import { listerCentres } from '../services/centreCoutApi';
import { listerPaiements } from '../services/paiementApi';
import { erreursParChamp, messageErreur } from '../services/api';
import { dateFr, formatMAD } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import AsyncState from '../components/ui/AsyncState';
import DataTable, { MenuActionsLigne, BasculeDensite, MenuColonnes } from '../components/ui/DataTable';
import SearchToolbar from '../components/ui/SearchToolbar';
import StatusBadge from '../components/ui/StatusBadge';
import Amount from '../components/ui/Amount';
import Field from '../components/ui/Field';
import Combobox from '../components/ui/Combobox';
import Button from '../components/ui/Button';
import CrudModal from '../components/ui/CrudModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ExportButton from '../components/ui/ExportButton';
import MessageErreur from '../components/MessageErreur';
import Icone from '../components/Icone';
import { useToast } from '../components/ui/ToastRegion';

function aujourdhui() {
  return new Date().toLocaleDateString('sv-SE');
}

const ONGLETS = [
  ['TOUTES', 'Toutes'],
  ['BROUILLON', 'Brouillon'],
  ['VALIDEE', 'Validée'],
  ['PAYEE', 'Payée'],
];

export default function Factures() {
  const { showToast } = useToast();
  const [factures, setFactures] = useState([]);
  const [paiements, setPaiements] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [clients, setClients] = useState([]);
  const [centres, setCentres] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [action, setAction] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [onglet, setOnglet] = useState('TOUTES');
  const [formulaireOuvert, setFormulaireOuvert] = useState(false);
  const [factureEnCours, setFactureEnCours] = useState(null);
  const [formulaire, setFormulaire] = useState({
    type: 'ACHAT', numero: '', dateFacture: aujourdhui(), montantHT: '', tauxTVA: '20', tiersId: '',
  });
  const [factureAValider, setFactureAValider] = useState(null);
  const [centreCoutId, setCentreCoutId] = useState('');
  const [factureASupprimer, setFactureASupprimer] = useState(null);
  const [erreurModale, setErreurModale] = useState('');

  async function chargerDonnees() {
    setChargement(true);
    setErreur('');
    try {
      const [f, fournisseursRecus, clientsRecus, centresRecus, paiementsRecus] = await Promise.all([
        listerFactures(), listerFournisseurs(), listerClients(), listerCentres(), listerPaiements(),
      ]);
      setFactures(f);
      setFournisseurs(fournisseursRecus);
      setClients(clientsRecus);
      setCentres(centresRecus);
      setPaiements(paiementsRecus);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    chargerDonnees();
  }, []);

  const tiers = formulaire.type === 'ACHAT' ? fournisseurs : clients;

  // Reste à payer : TTC diminué des montants déjà affectés dans les paiements.
  function dejaAffecte(factureId) {
    return paiements.reduce((total, p) => total + (p.factures || [])
      .filter((f) => String(f.id) === String(factureId))
      .reduce((s, f) => s + Number(f.montantAffecte), 0), 0);
  }
  const resteAPayer = (facture) => Math.max(0, Number(facture.montantTTC) - dejaAffecte(facture.id));

  const comptes = useMemo(() => {
    const total = { TOUTES: factures.length, BROUILLON: 0, VALIDEE: 0, PAYEE: 0 };
    factures.forEach((f) => { if (total[f.statut] != null) total[f.statut] += 1; });
    return total;
  }, [factures]);

  const facturesVisibles = useMemo(() => {
    const filtre = recherche.trim().toLowerCase();
    return factures.filter((f) => (onglet === 'TOUTES' || f.statut === onglet)
      && (!filtre
        || f.numero.toLowerCase().includes(filtre)
        || f.tiersNom.toLowerCase().includes(filtre)
        || f.type.toLowerCase().includes(filtre)));
  }, [factures, recherche, onglet]);

  const resume = useMemo(() => factures.reduce((acc, f) => ({
    ht: acc.ht + Number(f.montantHT),
    ttc: acc.ttc + Number(f.montantTTC),
    reste: acc.reste + resteAPayer(f),
  }), { ht: 0, ttc: 0, reste: 0 }), [factures, paiements]);

  function ouvrirCreation() {
    setFactureEnCours(null);
    setFormulaire({ type: 'ACHAT', numero: '', dateFacture: aujourdhui(), montantHT: '', tauxTVA: '20', tiersId: '' });
    setErreurModale('');
    setFormulaireOuvert(true);
  }

  function ouvrirModification(facture) {
    setFactureEnCours(facture);
    setFormulaire({
      type: facture.type,
      numero: facture.numero,
      dateFacture: facture.dateFacture,
      montantHT: String(facture.montantHT),
      tauxTVA: String(facture.tauxTVA),
      tiersId: String(facture.tiersId),
    });
    setErreurModale('');
    setFormulaireOuvert(true);
  }

  async function enregistrer(e) {
    e.preventDefault();
    const ht = Number(formulaire.montantHT);
    const tva = Number(formulaire.tauxTVA);
    if (!formulaire.numero.trim() || !formulaire.dateFacture || !formulaire.tiersId
      || !Number.isFinite(ht) || ht <= 0 || !Number.isFinite(tva) || tva < 0 || tva > 100) {
      setErreurModale('Complétez les champs requis avec un montant HT positif et un taux de TVA entre 0 et 100.');
      return;
    }
    setAction(true);
    setErreurModale('');
    try {
      const payload = {
        numero: formulaire.numero.trim(),
        dateFacture: formulaire.dateFacture,
        type: formulaire.type,
        montantHT: ht,
        tauxTVA: tva,
        tiersId: Number(formulaire.tiersId),
      };
      if (factureEnCours) {
        const maj = await modifierFacture(factureEnCours.id, payload);
        setFactures((precedentes) => precedentes.map((f) => f.id === maj.id ? maj : f));
        showToast(`Facture ${maj.numero} mise à jour.`);
      } else {
        const cree = await creerFacture(payload);
        setFactures((precedentes) => [cree, ...precedentes]);
        showToast(`Facture ${cree.numero} créée en brouillon.`);
      }
      setFormulaireOuvert(false);
    } catch (e2) {
      const champs = erreursParChamp(e2);
      setErreurModale(Object.values(champs)[0] || messageErreur(e2));
    } finally {
      setAction(false);
    }
  }

  function demanderValidation() {
    setAction(true);
    setErreurModale('');
    validerFacture(factureAValider.id, {
      centreCoutId: factureAValider.type === 'ACHAT' ? Number(centreCoutId) : null,
    }).then((maj) => {
      setFactures((precedentes) => precedentes.map((f) => f.id === maj.id ? maj : f));
      setFactureAValider(null);
      showToast(`Facture ${maj.numero} validée et comptabilisée${maj.pieceNumero ? ` (${maj.pieceNumero})` : ''}.`);
    }).catch((e) => {
      setErreurModale(messageErreur(e));
      showToast(messageErreur(e), 'error');
    }).finally(() => setAction(false));
  }

  function confirmerSuppression() {
    if (!factureASupprimer) return;
    setAction(true);
    supprimerFacture(factureASupprimer.id)
      .then(() => {
        setFactures((precedentes) => precedentes.filter((f) => f.id !== factureASupprimer.id));
        showToast(`Facture ${factureASupprimer.numero} supprimée.`);
        setFactureASupprimer(null);
      })
      .catch((e) => {
        showToast(messageErreur(e), 'error');
        setFactureASupprimer(null);
      })
      .finally(() => setAction(false));
  }

  const colonnes = [
    {
      key: 'numero',
      label: 'N°',
      sortable: true,
      cell: (f) => ({ principal: <strong>{f.numero}</strong>, secondaire: f.tiersNom }),
    },
    { key: 'type', label: 'Type', render: (f) => (f.type === 'ACHAT' ? 'Achat' : 'Vente') },
    { key: 'dateFacture', label: 'Échéance', sortable: true, nowrap: true, render: (f) => dateFr(f.dateFacture) },
    { key: 'montantHT', label: 'HT', numeric: true, nowrap: true, priorite: 2, render: (f) => <Amount value={f.montantHT} /> },
    { key: 'montantTVA', label: 'TVA', numeric: true, nowrap: true, priorite: 2, render: (f) => <Amount value={Number(f.montantTTC) - Number(f.montantHT)} /> },
    { key: 'montantTTC', label: 'TTC', numeric: true, nowrap: true, render: (f) => <strong><Amount value={f.montantTTC} /></strong> },
    { key: 'reste', label: 'Reste à payer', numeric: true, nowrap: true, render: (f) => <Amount value={resteAPayer(f)} /> },
    { key: 'statut', label: 'Statut', render: (f) => <StatusBadge status={f.statut} /> },
    {
      key: 'actions',
      label: 'Actions',
      actions: true,
      masquable: false,
      render: (f) => (
        <div className="actions-cell">
          <ExportButton endpoint={`/factures/${f.id}/export/pdf`} format="pdf" compact />
          {f.statut === 'BROUILLON' ? (
            <MenuActionsLigne
              actions={[
                { label: 'Modifier', icone: 'editer', principale: true, onSelect: () => ouvrirModification(f) },
                { label: 'Comptabiliser', icone: 'valide', onSelect: () => { setFactureAValider(f); setCentreCoutId(''); setErreurModale(''); } },
                { label: 'Supprimer', icone: 'supprimer', danger: true, separateurAvant: true, onSelect: () => setFactureASupprimer(f) },
              ]}
            />
          ) : <span className="texte-secondaire">{f.pieceNumero || 'Comptabilisée'}</span>}
        </div>
      ),
    },
  ];

  return (
    <section>
      <PageHeader
        title="Factures"
        description="Saisissez les factures d’achat et de vente, puis comptabilisez-les."
        actions={(
          <Button type="button" onClick={ouvrirCreation}>
            <Icone nom="plus" taille={18} /> Nouvelle facture
          </Button>
        )}
      />

      <AsyncState loading={chargement} error={erreur} onRetry={chargerDonnees}>
        <div className="carte-resume">
          <div className="carte-resume-item"><small>Total HT</small><Amount value={resume.ht} /></div>
          <div className="carte-resume-item"><small>Total TVA</small><Amount value={resume.ttc - resume.ht} /></div>
          <div className="carte-resume-item"><small>Total TTC</small><Amount value={resume.ttc} /></div>
          <div className="carte-resume-item accent"><small>Reste à payer</small><Amount value={resume.reste} /></div>
        </div>

        <div className="panneau">
          <div className="onglets-statut" role="tablist" aria-label="Filtrer par statut">
            {ONGLETS.map(([code, libelle]) => (
              <button key={code} type="button" role="tab" aria-selected={onglet === code}
                className={`onglet-statut ${onglet === code ? 'actif' : ''}`} onClick={() => setOnglet(code)}>
                {libelle}<span className="onglet-compte">{comptes[code]}</span>
              </button>
            ))}
          </div>
          <SearchToolbar value={recherche} onChange={setRecherche} placeholder="Rechercher une facture, un tiers…"
            resultCount={`${facturesVisibles.length} facture${facturesVisibles.length > 1 ? 's' : ''}`}
            actions={(
              <>
                <BasculeDensite />
                <MenuColonnes storageKey="factures" colonnes={colonnes} />
              </>
            )} />
          <DataTable columns={colonnes} rows={facturesVisibles} storageKey="factures" empty="Aucune facture à afficher." />
        </div>
      </AsyncState>

      <CrudModal
        open={formulaireOuvert}
        onOpenChange={setFormulaireOuvert}
        title={factureEnCours ? 'Modifier la facture' : 'Nouvelle facture'}
        footer={(
          <>
            <Button variant="secondary" type="button" onClick={() => setFormulaireOuvert(false)}>Annuler</Button>
            <Button type="submit" form="formulaire-facture" loading={action} disabled={tiers.length === 0}>
              {action ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </>
        )}
      >
        <MessageErreur message={erreurModale} />
        <form id="formulaire-facture" className="pile" onSubmit={enregistrer}>
          <Field id="facture-type" label="Type de facture">
            {(p) => (
              <select className="input" value={formulaire.type} disabled={Boolean(factureEnCours)}
                onChange={(e) => setFormulaire({ ...formulaire, type: e.target.value, tiersId: '' })} {...p}>
                <option value="ACHAT">Achat fournisseur</option><option value="VENTE">Vente client</option>
              </select>
            )}
          </Field>
          <Field id="facture-numero" label="Numéro" required>
            {(p) => <input className="input" maxLength={30} value={formulaire.numero} onChange={(e) => setFormulaire({ ...formulaire, numero: e.target.value })} {...p} />}
          </Field>
          <Field id="facture-date" label="Date de facture" required>
            {(p) => <input className="input" type="date" max={aujourdhui()} value={formulaire.dateFacture} onChange={(e) => setFormulaire({ ...formulaire, dateFacture: e.target.value })} {...p} />}
          </Field>
          <Combobox
            id="facture-tiers"
            label={formulaire.type === 'ACHAT' ? 'Fournisseur' : 'Client'}
            options={tiers.map((t) => ({ value: String(t.id), label: t.nom }))}
            value={formulaire.tiersId}
            onChange={(v) => setFormulaire({ ...formulaire, tiersId: v })}
            placeholder="Sélectionner un tiers"
            hint={tiers.length === 0 ? `Créez d’abord un ${formulaire.type === 'ACHAT' ? 'fournisseur' : 'client'} dans l’espace Tiers.` : undefined}
          />
          <div className="grille-formulaire">
            <Field id="facture-ht" label="Montant HT (MAD)" required>
              {(p) => <input className="input" type="number" min="0.01" step="0.01" value={formulaire.montantHT} onChange={(e) => setFormulaire({ ...formulaire, montantHT: e.target.value })} {...p} />}
            </Field>
            <Field id="facture-tva" label="TVA (%)" required>
              {(p) => <input className="input" type="number" min="0" max="100" step="0.01" value={formulaire.tauxTVA} onChange={(e) => setFormulaire({ ...formulaire, tauxTVA: e.target.value })} {...p} />}
            </Field>
          </div>
        </form>
      </CrudModal>

      <CrudModal
        open={Boolean(factureAValider)}
        onOpenChange={(o) => !o && setFactureAValider(null)}
        title="Comptabiliser la facture"
        footer={(
          <>
            <Button variant="secondary" type="button" onClick={() => setFactureAValider(null)}>Annuler</Button>
            <Button type="button" loading={action} onClick={demanderValidation}
              disabled={factureAValider?.type === 'ACHAT' && centres.length === 0}>
              {action ? 'Validation…' : 'Valider et comptabiliser'}
            </Button>
          </>
        )}
      >
        <MessageErreur message={erreurModale} />
        {factureAValider && (
          <p>La validation crée et valide une pièce comptable pour <strong>{factureAValider.numero}</strong> ({formatMAD(factureAValider.montantTTC)} TTC).</p>
        )}
        {factureAValider?.type === 'ACHAT' && (
          <Combobox
            id="facture-centre"
            label="Centre de coûts"
            options={centres.map((c) => ({ value: String(c.id), label: `${c.code} — ${c.libelle}` }))}
            value={centreCoutId}
            onChange={setCentreCoutId}
            placeholder="Sélectionner un centre"
            required
          />
        )}
      </CrudModal>

      <ConfirmDialog
        open={Boolean(factureASupprimer)}
        onOpenChange={(o) => !o && setFactureASupprimer(null)}
        title="Supprimer la facture"
        description={factureASupprimer ? `Supprimer le brouillon ${factureASupprimer.numero} ? Cette action est irréversible.` : ''}
        confirmLabel="Supprimer"
        danger
        loading={action}
        onConfirm={confirmerSuppression}
      />
    </section>
  );
}
