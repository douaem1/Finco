import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { listerPieces } from '../services/ecritureApi';
import { messageErreur } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { dateFr } from '../utils/format';
import PageHeader from '../components/ui/PageHeader';
import AsyncState from '../components/ui/AsyncState';
import DataTable, { BasculeDensite, MenuColonnes } from '../components/ui/DataTable';
import SearchToolbar from '../components/ui/SearchToolbar';
import StatusBadge from '../components/ui/StatusBadge';
import Amount from '../components/ui/Amount';
import Button from '../components/ui/Button';
import ExportButton from '../components/ui/ExportButton';
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
    {
      key: 'numero',
      label: 'N°',
      sortable: true,
      cell: (p) => ({
        principal: <Link to={`/pieces/${p.id}`} className="numero-piece">{p.numero}</Link>,
        secondaire: `${p.libelle} · ${dateFr(p.dateEcriture)}`,
      }),
    },
    { key: 'exercice', label: 'Exercice', align: 'center', sortable: true, nowrap: true, render: (p) => p.exercice },
    { key: 'totalDebit', label: 'Débit', numeric: true, nowrap: true, sortable: true, render: (p) => <Amount value={p.totalDebit} /> },
    { key: 'totalCredit', label: 'Crédit', numeric: true, nowrap: true, sortable: true, render: (p) => <Amount value={p.totalCredit} /> },
    { key: 'saisiePar', label: 'Saisi par', priorite: 3, render: (p) => <span className="texte-secondaire">{p.saisiePar}</span> },
    { key: 'validee', label: 'Statut', render: (p) => <StatusBadge status={p.validee ? 'VALIDEE' : 'BROUILLON'} /> },
    { key: 'actions', label: 'Actions', actions: true, masquable: false, render: (p) => (
      <ExportButton endpoint={`/pieces/${p.id}/export/pdf`} format="pdf" compact />
    ) },
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
            actions={(
              <>
                <BasculeDensite />
                <MenuColonnes storageKey="liste-pieces" colonnes={colonnes} />
              </>
            )}
          />
          <DataTable columns={colonnes} rows={visibles} storageKey="liste-pieces" empty={`Aucune pièce ne correspond à « ${recherche} ».`} />
        </div>
      </AsyncState>
    </section>
  );
}
