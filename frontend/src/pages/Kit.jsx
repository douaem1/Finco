import { useState } from 'react';
import Button from '../components/ui/Button';
import Field from '../components/ui/Field';
import StatusBadge from '../components/ui/StatusBadge';
import Amount from '../components/ui/Amount';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import CrudModal from '../components/ui/CrudModal';
import { useToast } from '../components/ui/ToastRegion';
import SearchToolbar from '../components/ui/SearchToolbar';
import DataTable from '../components/ui/DataTable';
import EmptyState from '../components/ui/EmptyState';

export default function Kit() {
  const [dialog, setDialog] = useState(false);
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState('');
  const { showToast } = useToast();
  const rows = [{ id: 1, code: 'PROD', label: 'Production', amount: 12500 }];
  const columns = [{ key: 'code', label: 'Code', sortable: true }, { key: 'label', label: 'Libellé' }, { key: 'amount', label: 'Montant', numeric: true, render: (row) => <Amount value={row.amount} /> }];
  return <section className="pile-large"><header className="ui-page-header"><div><p className="date-du-jour">Développement</p><h1>Kit d’interface</h1><p className="texte-secondaire">États et primitives partagés de FinCo.</p></div></header><div className="carte pile"><h2>Actions</h2><div className="ui-page-actions"><Button onClick={() => setDialog(true)}>Ouvrir confirmation</Button><Button variant="secondary" onClick={() => setModal(true)}>Ouvrir formulaire</Button><Button variant="ghost" onClick={() => showToast('Centre enregistré avec succès.')}>Afficher un toast</Button></div></div><div className="carte pile"><h2>États financiers</h2><div className="ui-page-actions"><StatusBadge status="VALIDEE" /><StatusBadge status="BROUILLON" /><StatusBadge status="REJETEE" /><Amount value={12500} /></div></div><div className="carte pile"><h2>Champs et recherche</h2><Field id="kit-code" label="Code du centre" required hint="2 à 10 caractères.">{(props) => <input className="input" placeholder="Ex. PROD" {...props} />}</Field><SearchToolbar value={search} onChange={setSearch} placeholder="Rechercher un centre" resultCount="1 centre" /></div><div className="carte"><DataTable columns={columns} rows={rows} /></div><div className="carte"><EmptyState title="Aucun résultat" description="L’état vide du kit." /></div><ConfirmDialog open={dialog} onOpenChange={setDialog} title="Confirmer l’action" description="Cette action est irréversible." confirmLabel="Confirmer" onConfirm={() => { setDialog(false); showToast('Action confirmée.'); }} danger /><CrudModal open={modal} onOpenChange={setModal} title="Nouveau centre de coûts" footer={<><Button variant="secondary" onClick={() => setModal(false)}>Annuler</Button><Button onClick={() => { setModal(false); showToast('Centre enregistré.'); }}>Enregistrer</Button></>}><Field id="kit-modal-label" label="Libellé" required>{(props) => <input className="input" {...props} />}</Field></CrudModal></section>;
}