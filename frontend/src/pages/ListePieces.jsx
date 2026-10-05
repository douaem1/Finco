import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { listerPieces } from '../services/ecritureApi';
import { messageErreur } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { dateFr, montant } from '../utils/format';
import MessageErreur from '../components/MessageErreur';
import Chargement from '../components/Chargement';

const ROLES_SAISIE = ['COMPTABLE', 'ADMIN'];

export default function ListePieces() {
  const { utilisateur } = useAuth();
  const location = useLocation();
  const [pieces, setPieces] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    listerPieces()
      .then(setPieces)
      .catch((e) => setErreur(messageErreur(e)))
      .finally(() => setChargement(false));
  }, []);

  // Affichage seulement : le serveur refuse de toute façon (403) les autres rôles.
  const peutSaisir = ROLES_SAISIE.includes(utilisateur?.role);

  return (
    <section>
      <div className="f-titre-page">
        <div>
          <span className="f-etiquette">Comptabilité financière · FI</span>
          <h1>Journal des <span className="f-surligne">écritures</span></h1>
        </div>
        {peutSaisir && <Link to="/pieces/nouvelle" className="f-btn f-btn-corail">+ Nouvelle écriture</Link>}
      </div>

      {location.state?.succes && <div className="f-succes">{location.state.succes}</div>}
      <MessageErreur message={erreur} />

      {chargement ? <Chargement /> : pieces.length === 0 ? (
        <div className="f-vide f-papier">
          <p className="f-vide-icone">🧾</p>
          <p><b>Aucune écriture pour l’instant.</b></p>
          {peutSaisir && <Link to="/pieces/nouvelle" className="f-lien">Saisir la première écriture →</Link>}
        </div>
      ) : (
        <div className="f-papier f-tableau-cadre">
          <table className="f-tableau">
            <thead>
              <tr>
                <th>N° pièce</th><th>Date</th><th>Libellé</th><th>Saisie par</th>
                <th className="f-num">Montant (MAD)</th><th>Statut</th><th />
              </tr>
            </thead>
            <tbody>
              {pieces.map((p) => (
                <tr key={p.id}>
                  <td className="f-mono"><b>{p.numero}</b></td>
                  <td>{dateFr(p.dateEcriture)}</td>
                  <td>{p.libelle}</td>
                  <td className="f-muet">{p.saisiePar}</td>
                  <td className="f-num f-mono">{montant(p.totalDebit)}</td>
                  <td>
                    <span className={`f-statut ${p.validee ? 'valide' : 'brouillon'}`}>
                      {p.validee ? 'Validée' : 'Brouillon'}
                    </span>
                  </td>
                  <td><Link to={`/pieces/${p.id}`} className="f-lien">Détail →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
