import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { obtenirPiece } from '../services/ecritureApi';
import { messageErreur } from '../services/api';
import { dateFr, montant } from '../utils/format';
import MessageErreur from '../components/MessageErreur';
import Chargement from '../components/Chargement';
import Balance from '../components/Balance';

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
      <Link to="/pieces" className="lien-retour">Retour au journal</Link>

      {location.state?.succes && <p className="message-succes" role="status">{location.state.succes}</p>}
      <MessageErreur message={erreur} />
      {!piece && !erreur && <Chargement />}

      {piece && (
        <article className="panneau document">
          <header className="document-entete">
            <div>
              <p className="document-type">Pièce comptable</p>
              <h1 className="chiffres">{piece.numero}</h1>
            </div>
            <span className={`statut statut-grand ${piece.validee ? 'statut-validee' : 'statut-brouillon'}`}>
              {piece.validee ? 'Validée' : 'Brouillon'}
            </span>
          </header>

          <dl className="document-infos">
            <div><dt>Date d’écriture</dt><dd className="chiffres">{dateFr(piece.dateEcriture)}</dd></div>
            <div><dt>Exercice</dt><dd className="chiffres">{piece.exercice}</dd></div>
            <div><dt>Saisie par</dt><dd>{piece.saisiePar}</dd></div>
            <div className="infos-large"><dt>Libellé</dt><dd>{piece.libelle}</dd></div>
          </dl>

          <table className="tableau tableau-ecriture">
            <thead>
              <tr><th>Compte</th><th>Centre de coûts</th><th className="num">Débit</th><th className="num">Crédit</th></tr>
            </thead>
            <tbody>
              {piece.lignes.map((l) => (
                <tr key={l.id}>
                  <td><span className="numero-compte">{l.compteNumero}</span> {l.compteLibelle}</td>
                  <td>{l.centreCoutCode ? <span className="code-centre">{l.centreCoutCode}</span> : <span className="texte-secondaire">—</span>}</td>
                  <td className="num chiffres">{l.sens === 'DEBIT' ? montant(l.montant) : ''}</td>
                  <td className="num chiffres">{l.sens === 'CREDIT' ? montant(l.montant) : ''}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={2}>Totaux en MAD</td>
                <td className="num chiffres">{montant(piece.totalDebit)}</td>
                <td className="num chiffres">{montant(piece.totalCredit)}</td>
              </tr>
            </tfoot>
          </table>

          <div className="document-pied">
            <Balance debit={Number(piece.totalDebit)} credit={Number(piece.totalCredit)} compacte />
          </div>
        </article>
      )}
    </section>
  );
}
