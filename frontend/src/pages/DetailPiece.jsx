import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { obtenirPiece } from '../services/ecritureApi';
import { messageErreur } from '../services/api';
import { dateFr, montant } from '../utils/format';
import MessageErreur from '../components/MessageErreur';
import Chargement from '../components/Chargement';

export default function DetailPiece() {
  const { id } = useParams();
  const location = useLocation();
  const [piece, setPiece] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    obtenirPiece(id).then(setPiece).catch((e) => setErreur(messageErreur(e)));
  }, [id]);

  return (
    <section>
      <div className="f-titre-page">
        <div>
          <Link to="/pieces" className="f-lien f-retour">← Journal</Link>
          <h1>Pièce <span className="f-surligne f-mono">{piece?.numero ?? '…'}</span></h1>
        </div>
      </div>

      {location.state?.succes && <div className="f-succes">{location.state.succes}</div>}
      <MessageErreur message={erreur} />

      {!piece && !erreur && <Chargement />}

      {piece && (
        <article className="f-papier f-piece">
          <span className="f-perfos" aria-hidden="true"><i /><i /><i /></span>
          <span className={`f-tampon-statut ${piece.validee ? 'valide' : 'brouillon'}`}>
            {piece.validee ? 'VALIDÉE ✓' : 'BROUILLON'}
          </span>

          <dl className="f-meta">
            <div><dt>Date</dt><dd>{dateFr(piece.dateEcriture)}</dd></div>
            <div><dt>Exercice</dt><dd>{piece.exercice}</dd></div>
            <div><dt>Saisie par</dt><dd>{piece.saisiePar}</dd></div>
            <div className="f-meta-large"><dt>Libellé</dt><dd>{piece.libelle}</dd></div>
          </dl>

          <table className="f-tableau">
            <thead>
              <tr><th>Compte</th><th>Centre</th><th className="f-num">Débit</th><th className="f-num">Crédit</th></tr>
            </thead>
            <tbody>
              {piece.lignes.map((l) => (
                <tr key={l.id}>
                  <td><b className="f-mono">{l.compteNumero}</b> · {l.compteLibelle}</td>
                  <td>{l.centreCoutCode ? <span className="f-puce">{l.centreCoutCode}</span> : <span className="f-muet">—</span>}</td>
                  <td className="f-num f-mono">{l.sens === 'DEBIT' ? montant(l.montant) : ''}</td>
                  <td className="f-num f-mono">{l.sens === 'CREDIT' ? montant(l.montant) : ''}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>Totaux (MAD)</td>
                <td className="f-num f-mono">{montant(piece.totalDebit)}</td>
                <td className="f-num f-mono">{montant(piece.totalCredit)}</td>
              </tr>
            </tfoot>
          </table>
        </article>
      )}
    </section>
  );
}
