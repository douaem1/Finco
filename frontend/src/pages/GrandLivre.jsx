import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listerPieces, listerComptes } from '../services/ecritureApi';
import { messageErreur } from '../services/api';
import { dateFr } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import AsyncState from '../components/ui/AsyncState';
import DataTable from '../components/ui/DataTable';
import Field from '../components/ui/Field';
import Combobox from '../components/ui/Combobox';
import Amount from '../components/ui/Amount';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/ToastRegion';

export default function GrandLivre() {
  const { showToast } = useToast();
  const [pieces, setPieces] = useState([]);
  const [comptes, setComptes] = useState([]);
  const [compteNumero, setCompteNumero] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  async function chargerDonnees() {
    setChargement(true);
    setErreur('');
    try {
      const [piecesRecues, comptesRecus] = await Promise.all([listerPieces(), listerComptes()]);
      setPieces(piecesRecues);
      setComptes(comptesRecus);
    } catch (e) {
      const message = messageErreur(e);
      setErreur(message);
      showToast(message, 'error');
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { chargerDonnees(); }, []);

  const lignes = useMemo(() => pieces
    .filter((piece) => piece.validee)
    .flatMap((piece) => (piece.lignes || []).map((ligne) => ({
      ...ligne,
      pieceId: piece.id,
      pieceNumero: piece.numero,
      pieceLibelle: piece.libelle,
      dateEcriture: piece.dateEcriture,
    })))
    .filter((ligne) => !compteNumero || ligne.compteNumero === compteNumero)
    .sort((a, b) => a.dateEcriture.localeCompare(b.dateEcriture) || a.pieceNumero.localeCompare(b.pieceNumero)),
  [pieces, compteNumero]);

  const lignesPeriode = useMemo(() => lignes.filter((l) =>
    (!dateDebut || l.dateEcriture >= dateDebut) && (!dateFin || l.dateEcriture <= dateFin)), [lignes, dateDebut, dateFin]);

  const balance = useMemo(() => {
    const lignesParCompte = new Map();
    lignesPeriode.forEach((ligne) => {
      if (!lignesParCompte.has(ligne.compteNumero)) {
        lignesParCompte.set(ligne.compteNumero, {
          compteNumero: ligne.compteNumero, compteLibelle: ligne.compteLibelle, debit: 0, credit: 0,
        });
      }
      const ligneCompte = lignesParCompte.get(ligne.compteNumero);
      ligneCompte[ligne.sens === 'DEBIT' ? 'debit' : 'credit'] += Number(ligne.montant);
    });
    return comptes.map((compte) => {
      const totals = lignesParCompte.get(compte.numero) || { debit: 0, credit: 0 };
      return { ...compte, debit: totals.debit, credit: totals.credit, solde: totals.debit - totals.credit };
    }).sort((a, b) => a.numero.localeCompare(b.numero));
  }, [comptes, lignesPeriode]);

  const ouverture = useMemo(() => lignes
    .filter((l) => dateDebut && l.dateEcriture < dateDebut)
    .reduce((total, l) => total + (l.sens === 'DEBIT' ? Number(l.montant) : -Number(l.montant)), 0),
  [lignes, dateDebut]);

  let soldeCourant = ouverture;
  const lignesAvecSolde = lignesPeriode.map((ligne) => {
    soldeCourant += ligne.sens === 'DEBIT' ? Number(ligne.montant) : -Number(ligne.montant);
    return { ...ligne, soldeCourant };
  });

  const totauxBalance = balance.reduce((totaux, compte) => ({
    debit: totaux.debit + compte.debit,
    credit: totaux.credit + compte.credit,
  }), { debit: 0, credit: 0 });

  const colonnesBalance = [
    { key: 'numero', label: 'Compte', sortable: true, render: (c) => <button type="button" className="lien-bouton" onClick={() => setCompteNumero(c.numero)}>{c.numero}</button> },
    { key: 'libelle', label: 'Libellé', sortable: true },
    { key: 'debit', label: 'Débit', numeric: true, sortable: true, render: (c) => <Amount value={c.debit} /> },
    { key: 'credit', label: 'Crédit', numeric: true, sortable: true, render: (c) => <Amount value={c.credit} /> },
    { key: 'solde', label: 'Solde', numeric: true, sortable: true, render: (c) => <strong><Amount value={c.solde} /></strong> },
  ];

  const colonnesCompte = [
    { key: 'dateEcriture', label: 'Date', render: (l) => <span className="chiffres">{dateFr(l.dateEcriture)}</span> },
    { key: 'pieceNumero', label: 'Pièce', render: (l) => <Link to={`/pieces/${l.pieceId}`}>{l.pieceNumero}</Link> },
    { key: 'pieceLibelle', label: 'Libellé' },
    { key: 'centreCoutCode', label: 'Centre', render: (l) => l.centreCoutCode || '—' },
    { key: 'debit', label: 'Débit', numeric: true, render: (l) => (l.sens === 'DEBIT' ? <Amount value={l.montant} /> : '—') },
    { key: 'credit', label: 'Crédit', numeric: true, render: (l) => (l.sens === 'CREDIT' ? <Amount value={l.montant} /> : '—') },
    { key: 'soldeCourant', label: 'Solde', numeric: true, render: (l) => <Amount value={l.soldeCourant} /> },
  ];

  return (
    <section>
      <PageHeader
        title="Grand livre & balance"
        description="Consultez les mouvements validés et le solde de chaque compte."
      />

      <AsyncState loading={chargement} error={erreur} onRetry={chargerDonnees}>
        <div className="panneau filtre-rapport">
          <Combobox
            id="grand-livre-compte"
            label="Compte"
            options={comptes.map((c) => ({ value: c.numero, label: `${c.numero} — ${c.libelle}` }))}
            value={compteNumero}
            onChange={setCompteNumero}
            placeholder="Rechercher un compte…"
            vide="Tous les comptes — Balance"
          />
          <Field id="grand-livre-du" label="Du">
            {(p) => <input className="input" type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} {...p} />}
          </Field>
          <Field id="grand-livre-au" label="Au">
            {(p) => <input className="input" type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} {...p} />}
          </Field>
        </div>

        {!compteNumero ? (
          <>
            <div className="carte-resume">
              <div className="carte-resume-item"><small>Total débit</small><Amount value={totauxBalance.debit} /></div>
              <div className="carte-resume-item"><small>Total crédit</small><Amount value={totauxBalance.credit} /></div>
              <div className="carte-resume-item accent"><small>Solde de la période</small><Amount value={totauxBalance.debit - totauxBalance.credit} /></div>
            </div>
            <div className="panneau">
              <DataTable columns={colonnesBalance} rows={balance} empty="Aucun mouvement validé pour cette période." />
            </div>
          </>
        ) : (
          <div className="panneau">
            <header className="carte-entete">
              <div>
                <h2>{compteNumero} — {comptes.find((c) => c.numero === compteNumero)?.libelle}</h2>
                <p className="texte-secondaire">Solde d’ouverture : <Amount value={ouverture} /></p>
              </div>
              <Button variant="secondary" type="button" onClick={() => setCompteNumero('')}>Retour à la balance</Button>
            </header>
            <DataTable columns={colonnesCompte} rows={lignesAvecSolde} empty="Aucun mouvement pour ce compte et cette période." />
          </div>
        )}
      </AsyncState>
    </section>
  );
}
