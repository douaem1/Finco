import { useEffect, useMemo, useState } from 'react';
import { enregistrerPaiement, listerPaiements } from '../services/paiementApi';
import { listerFactures } from '../services/factureApi';
import { messageErreur } from '../services/api';
import { dateFr, montant } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import AsyncState from '../components/ui/AsyncState';
import DataTable from '../components/ui/DataTable';
import Amount from '../components/ui/Amount';
import StatusBadge from '../components/ui/StatusBadge';
import Field from '../components/ui/Field';
import Combobox from '../components/ui/Combobox';
import Button from '../components/ui/Button';
import CrudModal from '../components/ui/CrudModal';
import MessageErreur from '../components/MessageErreur';
import Icone from '../components/Icone';
import { useToast } from '../components/ui/ToastRegion';

const MODES = [
  ['VIREMENT', 'Virement'], ['CHEQUE', 'Chèque'], ['ESPECES', 'Espèces'], ['EFFET', 'Effet'],
];

function aujourdhui() {
  return new Date().toLocaleDateString('sv-SE');
}

export default function Paiements() {
  const { showToast } = useToast();
  const [paiements, setPaiements] = useState([]);
  const [factures, setFactures] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [action, setAction] = useState(false);
  const [erreur, setErreur] = useState('');
  const [modaleOuverte, setModaleOuverte] = useState(false);
  const [datePaiement, setDatePaiement] = useState(aujourdhui());
  const [mode, setMode] = useState('VIREMENT');
  const [allocations, setAllocations] = useState([{ factureId: '', montantAffecte: '' }]);
  const [erreurModale, setErreurModale] = useState('');

  async function chargerDonnees() {
    setChargement(true);
    setErreur('');
    try {
      const [p, f] = await Promise.all([listerPaiements(), listerFactures()]);
      setPaiements(p);
      setFactures(f);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { chargerDonnees(); }, []);

  function montantDejaAffecte(factureId) {
    return paiements.reduce((total, paiement) => total + (paiement.factures || [])
      .filter((f) => f.id === factureId)
      .reduce((sousTotal, f) => sousTotal + Number(f.montantAffecte), 0), 0);
  }

  const facturesReglables = useMemo(() => factures.filter((f) => f.statut === 'VALIDEE'), [factures]);
  const totalSaisi = allocations.reduce((total, a) => total + (Number(a.montantAffecte) || 0), 0);

  function modifierAllocation(index, champ, valeur) {
    setAllocations((precedentes) => precedentes.map((a, i) => i === index ? { ...a, [champ]: valeur } : a));
  }

  function ouvrirCreation() {
    setDatePaiement(aujourdhui());
    setMode('VIREMENT');
    setAllocations([{ factureId: '', montantAffecte: '' }]);
    setErreurModale('');
    setModaleOuverte(true);
  }

  async function enregistrer(e) {
    e.preventDefault();
    const lignes = allocations.filter((a) => a.factureId && a.montantAffecte);
    if (!datePaiement || lignes.length === 0 || lignes.some((a) => Number(a.montantAffecte) <= 0)) {
      setErreurModale('Saisissez une date et au moins une affectation avec un montant positif.');
      return;
    }
    if (new Set(lignes.map((a) => a.factureId)).size !== lignes.length) {
      setErreurModale('Chaque facture ne peut être sélectionnée qu’une fois.');
      return;
    }
    setAction(true);
    setErreurModale('');
    try {
      const cree = await enregistrerPaiement({
        datePaiement,
        mode,
        allocations: lignes.map((a) => ({ factureId: Number(a.factureId), montantAffecte: Number(a.montantAffecte) })),
      });
      setPaiements((precedents) => [cree, ...precedents]);
      setModaleOuverte(false);
      showToast(`Paiement de ${montant(cree.montant)} MAD enregistré en attente de validation.`);
    } catch (e2) {
      setErreurModale(messageErreur(e2));
    } finally {
      setAction(false);
    }
  }

  const colonnes = [
    { key: 'datePaiement', label: 'Date', sortable: true, render: (p) => <span className="chiffres">{dateFr(p.datePaiement)}</span> },
    {
      key: 'factures',
      label: 'Factures affectées',
      render: (p) => (p.factures?.length
        ? p.factures.map((f, i) => (
          <span key={f.id}>{i > 0 ? ', ' : ''}{f.numero} (<Amount value={f.montantAffecte} />)</span>
        ))
        : '—'),
    },
    { key: 'mode', label: 'Mode', render: (p) => MODES.find(([code]) => code === p.mode)?.[1] || p.mode },
    { key: 'montant', label: 'Montant', numeric: true, sortable: true, render: (p) => <strong><Amount value={p.montant} /></strong> },
    { key: 'valide', label: 'Statut', render: (p) => <StatusBadge status={p.valide ? 'VALIDEE' : 'BROUILLON'} label={p.valide ? 'Validé' : 'À valider'} /> },
    { key: 'validePar', label: 'Validé par', render: (p) => <span className="texte-secondaire">{p.validePar || 'En attente'}</span> },
  ];

  return (
    <section>
      <PageHeader
        title="Paiements"
        description="Enregistrez les règlements affectés aux factures validées."
        actions={(
          <Button type="button" onClick={ouvrirCreation} disabled={facturesReglables.length === 0}>
            <Icone nom="plus" taille={18} /> Enregistrer un paiement
          </Button>
        )}
      />

      <AsyncState
        loading={chargement}
        error={erreur}
        onRetry={chargerDonnees}
        empty={!chargement && !erreur && paiements.length === 0}
        emptyTitle="Aucun paiement enregistré."
        emptyDescription="Enregistrez un règlement pour le rattacher aux factures validées."
      >
        <div className="carte-resume">
          <div className="carte-resume-item"><small>Paiements</small>{paiements.length}</div>
          <div className="carte-resume-item accent"><small>Total saisi</small><Amount value={paiements.reduce((s, p) => s + Number(p.montant), 0)} /></div>
        </div>

        <div className="panneau">
          <DataTable columns={colonnes} rows={paiements} empty="Aucun paiement enregistré." />
        </div>
      </AsyncState>

      <CrudModal
        open={modaleOuverte}
        onOpenChange={setModaleOuverte}
        title="Enregistrer un paiement"
        footer={(
          <>
            <Button variant="secondary" type="button" onClick={() => setModaleOuverte(false)}>Annuler</Button>
            <Button type="submit" form="formulaire-paiement" loading={action} disabled={facturesReglables.length === 0}>
              {action ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </>
        )}
      >
        <MessageErreur message={erreurModale} />
        <form id="formulaire-paiement" className="pile" onSubmit={enregistrer}>
          <Field id="paiement-date" label="Date du paiement" required>
            {(p) => (
              <input
                className="input"
                type="date"
                max={aujourdhui()}
                value={datePaiement}
                onChange={(e) => setDatePaiement(e.target.value)}
                {...p}
              />
            )}
          </Field>

          <Field id="paiement-mode" label="Mode">
            {(p) => (
              <select className="input" value={mode} onChange={(e) => setMode(e.target.value)} {...p}>
                {MODES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
              </select>
            )}
          </Field>

          <div className="champ">
            <span className="champ-label">Affectation(s) aux factures</span>
            {allocations.map((allocation, index) => {
              const facture = factures.find((f) => String(f.id) === allocation.factureId);
              const reste = facture ? Number(facture.montantTTC) - montantDejaAffecte(facture.id) : 0;
              return (
                <div className="ligne-allocation" key={index}>
                  <Combobox
                    id={`paiement-facture-${index}`}
                    options={facturesReglables.map((f) => ({
                      value: String(f.id),
                      label: `${f.numero} — ${f.tiersNom} (solde ${montant(Number(f.montantTTC) - montantDejaAffecte(f.id))} MAD)`,
                    }))}
                    value={allocation.factureId}
                    onChange={(v) => modifierAllocation(index, 'factureId', v)}
                    placeholder="Choisir une facture"
                    vide="Choisir une facture"
                  />
                  <input
                    className="input"
                    aria-label={`Montant affecté ${index + 1}`}
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={reste || undefined}
                    placeholder="Montant MAD"
                    value={allocation.montantAffecte}
                    onChange={(e) => modifierAllocation(index, 'montantAffecte', e.target.value)}
                  />
                  {allocations.length > 1 && (
                    <button
                      type="button"
                      className="btn-action btn-action-supprimer"
                      onClick={() => setAllocations((precedentes) => precedentes.filter((_, i) => i !== index))}
                      aria-label="Retirer cette facture"
                    >
                      <Icone nom="supprimer" taille={16} />
                    </button>
                  )}
                </div>
              );
            })}
            <Button
              variant="secondary"
              type="button"
              onClick={() => setAllocations((precedentes) => [...precedentes, { factureId: '', montantAffecte: '' }])}
            >
              Ajouter une facture
            </Button>
          </div>

          <p className="texte-secondaire">
            Total du paiement : <strong><Amount value={totalSaisi} /></strong>. La direction devra valider ce paiement.
          </p>
        </form>
      </CrudModal>
    </section>
  );
}
