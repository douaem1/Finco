import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { listerPieces } from '../services/ecritureApi';
import { messageErreur } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { dateFr, montant } from '../utils/format';
import MessageErreur from '../components/MessageErreur';
import Chargement from '../components/Chargement';
import Icone from '../components/Icone';

const ROLES_SAISIE = ['COMPTABLE', 'ADMIN'];

export default function ListePieces() {
  const { utilisateur } = useAuth();
  const location = useLocation();
  const [pieces, setPieces] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    listerPieces()
      .then(setPieces)
      .catch((e) => setErreur(messageErreur(e)))
      .finally(() => setChargement(false));
  }, []);

  // Affichage seulement : le serveur refuse de toute façon (403) les autres rôles.
  const peutSaisir = ROLES_SAISIE.includes(utilisateur?.role);

  // Filtre d'affichage (aucune règle métier) : numéro ou libellé.
  const filtre = recherche.trim().toLowerCase();
  const visibles = useMemo(() => pieces.filter((p) =>
    !filtre || p.numero.toLowerCase().includes(filtre) || p.libelle.toLowerCase().includes(filtre)), [pieces, filtre]);

  const brouillons = pieces.filter((p) => !p.validee).length;
  const mouvements = pieces.reduce((t, p) => t + Number(p.totalDebit || 0), 0);

  return (
    <section>
      <header className="entete-page">
        <div>
          <p className="fil">Comptabilité financière</p>
          <h1>Journal des écritures</h1>
        </div>
        {peutSaisir && (
          <Link to="/pieces/nouvelle" className="btn btn-primaire"><Icone nom="plus" taille={18} /> Nouvelle écriture</Link>
        )}
      </header>

      {location.state?.succes && <p className="message-succes" role="status">{location.state.succes}</p>}
      <MessageErreur message={erreur} />

      {!chargement && pieces.length > 0 && (
        <dl className="synthese">
          <div><dt>Pièces saisies</dt><dd className="chiffres">{pieces.length}</dd></div>
          <div><dt>En brouillon</dt><dd className="chiffres">{brouillons}</dd></div>
          <div><dt>Validées</dt><dd className="chiffres">{pieces.length - brouillons}</dd></div>
          <div className="synthese-large"><dt>Total des mouvements</dt><dd className="chiffres">{montant(mouvements)} <small>MAD</small></dd></div>
        </dl>
      )}

      {chargement ? <Chargement /> : pieces.length === 0 ? (
        <div className="panneau vide">
          <Icone nom="journal" taille={36} />
          <p><strong>Aucune écriture pour l’instant.</strong></p>
          <p className="texte-secondaire">Les pièces saisies apparaîtront ici, de la plus récente à la plus ancienne.</p>
          {peutSaisir && <Link to="/pieces/nouvelle" className="btn btn-primaire">Saisir la première écriture</Link>}
        </div>
      ) : (
        <div className="panneau">
          <div className="barre-outils">
            <label className="recherche">
              <Icone nom="recherche" taille={18} />
              <input type="search" placeholder="Rechercher un numéro ou un libellé" value={recherche}
                onChange={(e) => setRecherche(e.target.value)} aria-label="Rechercher une pièce" />
            </label>
            <span className="texte-secondaire">{visibles.length} pièce{visibles.length > 1 ? 's' : ''}</span>
          </div>
          <div className="defilement">
            <table className="tableau">
              <thead>
                <tr>
                  <th>Pièce</th><th>Date</th><th>Libellé</th><th>Saisie par</th>
                  <th className="num">Montant (MAD)</th><th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((p) => (
                  <tr key={p.id}>
                    <td><Link to={`/pieces/${p.id}`} className="numero-piece">{p.numero}</Link></td>
                    <td className="chiffres">{dateFr(p.dateEcriture)}</td>
                    <td>{p.libelle}</td>
                    <td className="texte-secondaire">{p.saisiePar}</td>
                    <td className="num chiffres montant-fort">{montant(p.totalDebit)}</td>
                    <td>
                      <span className={`statut ${p.validee ? 'statut-validee' : 'statut-brouillon'}`}>
                        {p.validee ? 'Validée' : 'Brouillon'}
                      </span>
                    </td>
                  </tr>
                ))}
                {visibles.length === 0 && (
                  <tr><td colSpan={6} className="texte-secondaire aucun-resultat">Aucune pièce ne correspond à « {recherche} ».</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
