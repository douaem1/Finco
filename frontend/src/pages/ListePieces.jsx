import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { listerPieces } from '../services/ecritureApi';
import { messageErreur } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { dateFr } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import AsyncState from '../components/ui/AsyncState';
import DataTable from '../components/ui/DataTable';
import SearchToolbar from '../components/ui/SearchToolbar';
import StatusBadge from '../components/ui/StatusBadge';
import Amount from '../components/ui/Amount';
import Button from '../components/ui/Button';
import Icone from '../components/Icone';
import { useToast } from '../components/ui/ToastRegion';

const ROLES_SAISIE = ['COMPTABLE'];

export default function ListePieces() {
  const { utilisateur } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [pieces, setPieces] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [recherche, setRecherche] = useState('');

  async function chargerPieces() {
    setChargement(true);
    setErreur('');
    try {
      setPieces(await listerPieces());
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { chargerPieces(); }, []);

  // Message de succès transmis par la navigation (retour depuis la saisie ou le détail).
  useEffect(() => {
    if (location.state?.succes) showToast(location.state.succes);
  }, [location.state, showToast]);

  // Affichage seulement : le serveur refuse de toute façon (403) les autres rôles.
  const peutSaisir = ROLES_SAISIE.includes(utilisateur?.role);

  // Filtre d'affichage (aucune règle métier) : numéro ou libellé.
  const filtre = recherche.trim().toLowerCase();
  const visibles = useMemo(() => pieces.filter((p) =>
    !filtre || p.numero.toLowerCase().includes(filtre) || p.libelle.toLowerCase().includes(filtre)), [pieces, filtre]);

  const colonnes = [
    { key: 'numero', label: 'Pièce', sortable: true, render: (p) => <Link to={`/pieces/${p.id}`} className="numero-piece">{p.numero}</Link> },
    { key: 'dateEcriture', label: 'Date', sortable: true, render: (p) => <span className="chiffres">{dateFr(p.dateEcriture)}</span> },
    { key: 'libelle', label: 'Libellé', sortable: true },
    { key: 'saisiePar', label: 'Saisie par', sortable: true, render: (p) => <span className="texte-secondaire">{p.saisiePar}</span> },
    { key: 'totalDebit', label: 'Montant', numeric: true, sortable: true, render: (p) => <strong><Amount value={p.totalDebit} /></strong> },
    { key: 'validee', label: 'Statut', render: (p) => <StatusBadge status={p.validee ? 'VALIDEE' : 'BROUILLON'} /> },
  ];

  return (
    <section>
      <PageHeader
        title="Journal des écritures"
        description="Toutes les pièces de l’exercice, de la plus récente à la plus ancienne."
        actions={peutSaisir && (
          <Button type="button" onClick={() => navigate('/pieces/nouvelle')}>
            <Icone nom="plus" taille={18} /> Nouvelle écriture
          </Button>
        )}
      />

      <AsyncState
        loading={chargement}
        error={erreur}
        onRetry={chargerPieces}
        empty={pieces.length === 0}
        emptyTitle="Aucune écriture pour l’instant."
        emptyDescription="Les pièces saisies apparaîtront ici, de la plus récente à la plus ancienne."
        emptyAction={peutSaisir && (
          <Button type="button" onClick={() => navigate('/pieces/nouvelle')}>Saisir la première écriture</Button>
        )}
      >
        <div className="panneau pile">
          <SearchToolbar
            value={recherche}
            onChange={setRecherche}
            placeholder="Rechercher un numéro ou un libellé…"
            resultCount={`${visibles.length} pièce${visibles.length > 1 ? 's' : ''}`}
          />
          <DataTable columns={colonnes} rows={visibles} empty={`Aucune pièce ne correspond à « ${recherche} ».`} />
        </div>
      </AsyncState>
    </section>
  );
}
