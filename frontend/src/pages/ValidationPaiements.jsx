import { useEffect, useState } from 'react';
import { listerPaiements, validerPaiement } from '../services/paiementApi';
import { messageErreur } from '../services/api';
import { dateFr, montant } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import AsyncState from '../components/ui/AsyncState';
import DataTable from '../components/ui/DataTable';
import Amount from '../components/ui/Amount';
import StatusBadge from '../components/ui/StatusBadge';
import Field from '../components/ui/Field';
import Button from '../components/ui/Button';
import CrudModal from '../components/ui/CrudModal';
import Icone from '../components/Icone';
import { useToast } from '../components/ui/ToastRegion';

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

  function confirmerRejet() {
    if (!rejetEnCours || !motifRejet.trim()) return;
    showToast('Le rejet des paiements n’est pas disponible : aucun service de rejet n’est déclaré.', 'error');
    setRejetEnCours(null);
    setMotifRejet('');
  }

  const enAttente = paiements.filter((p) => !p.valide);

  const colonnes = [
    { key: 'datePaiement', label: 'Date', sortable: true, render: (p) => <span className="chiffres">{dateFr(p.datePaiement)}</span> },
    {
      key: 'factures',
      label: 'Factures',
      render: (p) => (p.factures?.length
        ? p.factures.map((f, i) => (
          <span key={f.id}>{i > 0 ? ', ' : ''}{f.numero} (<Amount value={f.montantAffecte} />)</span>
        ))
        : 'Non affecté'),
    },
    { key: 'mode', label: 'Mode' },
    { key: 'montant', label: 'Montant', numeric: true, sortable: true, render: (p) => <strong><Amount value={p.montant} /></strong> },
    { key: 'valide', label: 'Statut', render: (p) => <StatusBadge status={p.valide ? 'VALIDEE' : 'BROUILLON'} label={p.valide ? 'Validé' : 'À valider'} /> },
    {
      key: 'actions',
      label: 'Action',
      render: (p) => (p.valide
        ? <span className="texte-secondaire">Par {p.validePar}</span>
        : (
          <div className="actions-cell">
            <Button type="button" onClick={() => approuver(p)} loading={action === p.id} disabled={action !== null}>
              <Icone nom="valide" taille={16} /> Valider
            </Button>
            <Button variant="danger" type="button" onClick={() => ouvrirRejet(p)} disabled={action !== null}>
              Rejeter
            </Button>
          </div>
        )),
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
          <DataTable columns={colonnes} rows={paiements} empty="Aucun paiement soumis à validation." />
        </div>
      </AsyncState>

      <CrudModal
        open={Boolean(rejetEnCours)}
        onOpenChange={(o) => !o && setRejetEnCours(null)}
        title="Rejeter le paiement"
        footer={(
          <>
            <Button variant="secondary" type="button" onClick={() => setRejetEnCours(null)}>Annuler</Button>
            <Button variant="danger" type="button" disabled={!motifRejet.trim()} onClick={confirmerRejet}>
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
