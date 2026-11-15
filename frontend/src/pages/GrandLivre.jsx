import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listerPieces, listerComptes } from '../services/ecritureApi';
import { messageErreur } from '../services/api';
import { dateFr, montant } from '../utils/format';
import MessageErreur from '../components/MessageErreur';
import Chargement from '../components/Chargement';

export default function GrandLivre() {
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
      setErreur(messageErreur(e));
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

  return (
    <section>
      <header className="entete-page"><div><h1>Grand livre &amp; balance</h1><p className="texte-secondaire">Consultez les mouvements validés et le solde de chaque compte.</p></div></header>
      <MessageErreur message={erreur} onRetry={chargerDonnees} />
      {chargement ? <Chargement /> : (
        <>
          <div className="panneau filtre-rapport">
            <label className="champ"><span className="champ-label">Compte</span><select className="input" value={compteNumero} onChange={(e) => setCompteNumero(e.target.value)}><option value="">Tous les comptes — Balance</option>{comptes.map((c) => <option key={c.id} value={c.numero}>{c.numero} — {c.libelle}</option>)}</select></label>
            <label className="champ"><span className="champ-label">Du</span><input type="date" className="input" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} /></label>
            <label className="champ"><span className="champ-label">Au</span><input type="date" className="input" value={dateFin} onChange={(e) => setDateFin(e.target.value)} /></label>
          </div>
          {!compteNumero ? (
            <div className="panneau">
              <div className="defilement"><table className="tableau">
                <thead><tr><th>Compte</th><th>Libellé</th><th className="num">Débit (MAD)</th><th className="num">Crédit (MAD)</th><th className="num">Solde (MAD)</th></tr></thead>
                <tbody>
                  {balance.map((c) => <tr key={c.id}><td><button type="button" className="lien-bouton" onClick={() => setCompteNumero(c.numero)}>{c.numero}</button></td><td>{c.libelle}</td><td className="num chiffres">{montant(c.debit)}</td><td className="num chiffres">{montant(c.credit)}</td><td className="num chiffres"><strong>{montant(c.solde)}</strong></td></tr>)}
                  {balance.length === 0 && <tr><td colSpan={5} className="texte-secondaire aucun-resultat">Aucun mouvement validé pour cette période.</td></tr>}
                </tbody>
                <tfoot><tr><td colSpan={2}>Totaux de la période</td><td className="num chiffres">{montant(totauxBalance.debit)}</td><td className="num chiffres">{montant(totauxBalance.credit)}</td><td className="num chiffres">{montant(totauxBalance.debit - totauxBalance.credit)}</td></tr></tfoot>
              </table></div>
            </div>
          ) : (
            <div className="panneau">
              <header className="carte-entete"><div><h2>{compteNumero} — {comptes.find((c) => c.numero === compteNumero)?.libelle}</h2><p className="texte-secondaire">Solde d’ouverture : {montant(ouverture)} MAD</p></div><button type="button" className="btn btn-secondaire btn-petit" onClick={() => setCompteNumero('')}>Retour à la balance</button></header>
              <div className="defilement"><table className="tableau">
                <thead><tr><th>Date</th><th>Pièce</th><th>Libellé</th><th>Centre</th><th className="num">Débit</th><th className="num">Crédit</th><th className="num">Solde</th></tr></thead>
                <tbody>
                  {lignesAvecSolde.map((l, index) => <tr key={`${l.pieceId}-${l.id || index}`}><td className="chiffres">{dateFr(l.dateEcriture)}</td><td><Link to={`/pieces/${l.pieceId}`}>{l.pieceNumero}</Link></td><td>{l.pieceLibelle}</td><td>{l.centreCoutCode || '—'}</td><td className="num chiffres">{l.sens === 'DEBIT' ? montant(l.montant) : '—'}</td><td className="num chiffres">{l.sens === 'CREDIT' ? montant(l.montant) : '—'}</td><td className="num chiffres">{montant(l.soldeCourant)}</td></tr>)}
                  {lignesPeriode.length === 0 && <tr><td colSpan={7} className="texte-secondaire aucun-resultat">Aucun mouvement pour ce compte et cette période.</td></tr>}
                </tbody>
              </table></div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
