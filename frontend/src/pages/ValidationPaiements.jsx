import { useEffect, useState } from 'react';
import { listerPaiements, validerPaiement, rejeterPaiement } from '../services/paiementApi';
import { messageErreur } from '../services/api';
import { dateFr, montant } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import AsyncState from '../components/ui/AsyncState';
import DataTable, { MenuActionsLigne } from '../components/ui/DataTable';
import Amount from '../components/ui/Amount';
import StatusBadge from '../components/ui/StatusBadge';
import Field from '../components/ui/Field';
import Button from '../components/ui/Button';
import CrudModal from '../components/ui/CrudModal';
import Tooltip from '../components/ui/Tooltip';
import { useToast } from '../components/ui/ToastRegion';

const MODES = [
  ['VIREMENT', 'Virement'], ['CHEQUE', 'Chèque'], ['ESPECES', 'Espèces'], ['EFFET', 'Effet'],
];

const MAX_FACTURES_VISIBLES = 2;

/** Factures affectées en puces ; au-delà de deux, une puce « +N » porte l'infobulle. */
function ChipsFactures({ factures, vide = '—' }) {
  if (!factures?.length) return vide;
  const principales = factures.slice(0, MAX_FACTURES_VISIBLES);
  const reste = factures.slice(MAX_FACTURES_VISIBLES);
  return (
    <span className="ui-search-chips">
      {principales.map((f) => <span key={f.id} className="ui-chip">{f.numero}</span>)}
      {reste.length > 0 && (
        <Tooltip label={reste.map((f) => `${f.numero} (${montant(f.montantAffecte)} MAD)`).join(' · ')} side="top">
          <span className="ui-chip">+{reste.length}</span>
        </Tooltip>
      )}
    </span>
  );
}

export default function ValidationPaiements() {
  const { showToast } = useToast();
  const [paiements, setPaiements] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [action, setAction] = useState(null);
  const [erreur, setErreur] = useState('');
  const [rejetEnCours, setRejetEnCours] = useState(null);
  const [motifRejet, setMotifRejet] = useState('');

  async function chargerDonnees() {
    setChargement(true);
    setErreur('');
    try {
      setPaiements(await listerPaiements());
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { chargerDonnees(); }, []);

  async function approuver(paiement) {
    setAction(paiement.id);
    try {
      const maj = await validerPaiement(paiement.id);
      setPaiements((precedents) => precedents.map((p) => p.id === maj.id ? maj : p));
      showToast(`Paiement de ${montant(maj.montant)} MAD validé.`);
    } catch (e) {
      showToast(messageErreur(e), 'error');
    } finally {
      setAction(null);
    }
  }

  function ouvrirRejet(paiement) {
    setRejetEnCours(paiement);
    setMotifRejet('');
  }

  async function confirmerRejet() {
    const motif = motifRejet.trim();
    if (!rejetEnCours || motif.length < 5) return;
    setAction(rejetEnCours.id);
    try {
      await rejeterPaiement(rejetEnCours.id, motif);
      showToast('Paiement rejeté.');
      setRejetEnCours(null);
      setMotifRejet('');
      await chargerDonnees();
    } catch (e) {
      showToast(messageErreur(e), 'error');
    } finally {
      setAction(null);
    }
  }

  const enAttente = paiements.filter((p) => !p.valide && !p.rejete);

  const colonnes = [
    {
      key: 'datePaiement',
      label: 'Date',
      sortable: true,
      nowrap: true,
      cell: (p) => ({ principal: dateFr(p.datePaiement), secondaire: MODES.find(([code]) => code === p.mode)?.[1] || p.mode }),
    },
    { key: 'montant', label: 'Montant', numeric: true, nowrap: true, sortable: true, render: (p) => <strong><Amount value={p.montant} /></strong> },
    { key: 'factures', label: 'Factures concernées', render: (p) => <ChipsFactures factures={p.factures} vide="Non affecté" /> },
    {
      key: 'valide',
      label: 'Statut',
      render: (p) => {
        if (p.valide) return <StatusBadge status="VALIDEE" label="Validé" />;
        if (p.rejete) return <StatusBadge status="REJETEE" label="Rejeté" />;
        return <StatusBadge status="BROUILLON" label="À valider" />;
      },
    },
    {
      key: 'actions',
      label: 'Action',
      actions: true,
      masquable: false,
      render: (p) => {
        if (p.valide) return <span className="texte-secondaire">Par {p.validePar}</span>;
        if (p.rejete) return <span className="texte-secondaire">Rejeté par {p.rejetePar} — {p.motifRejet}</span>;
        return (
          <MenuActionsLigne
            actions={[
              { label: 'Valider', icone: 'valide', principale: true, onSelect: () => approuver(p) },
              { label: 'Rejeter', icone: 'croix', danger: true, separateurAvant: true, onSelect: () => ouvrirRejet(p) },
            ]}
          />
        );
      },
    },
  ];

  return (
    <section>
      <PageHeader
        title="Validation des paiements"
        description="Contrôlez les règlements préparés par la comptabilité avant approbation."
        actions={<StatusBadge status="BROUILLON" label={`${enAttente.length} en attente`} />}
      />

      <AsyncState
        loading={chargement}
        error={erreur}
        onRetry={chargerDonnees}
        empty={!chargement && !erreur && paiements.length === 0}
        emptyTitle="Aucun paiement soumis à validation."
        emptyDescription="Les règlements enregistrés par la comptabilité apparaîtront ici."
      >
        <div className="panneau">
          <DataTable columns={colonnes} rows={paiements} storageKey="validation-paiements" empty="Aucun paiement soumis à validation." />
        </div>
      </AsyncState>

      <CrudModal
        open={Boolean(rejetEnCours)}
        onOpenChange={(o) => !o && setRejetEnCours(null)}
        title="Rejeter le paiement"
        footer={(
          <>
            <Button variant="secondary" type="button" onClick={() => setRejetEnCours(null)}>Annuler</Button>
            <Button
              variant="danger"
              type="button"
              loading={action === rejetEnCours?.id}
              disabled={motifRejet.trim().length < 5}
              onClick={confirmerRejet}
            >
              Rejeter
            </Button>
          </>
        )}
      >
        {rejetEnCours && (
          <p>
            Indiquez le motif du rejet du paiement de <strong><Amount value={rejetEnCours.montant} /></strong>.
            Ce motif est obligatoire.
          </p>
        )}
        <Field id="motif-rejet" label="Motif du rejet" required>
          {(p) => (
            <textarea
              className="input"
              rows={3}
              placeholder="Expliquez pourquoi ce paiement est rejeté…"
              value={motifRejet}
              onChange={(e) => setMotifRejet(e.target.value)}
              {...p}
            />
          )}
        </Field>
      </CrudModal>
    </section>
  );
}
