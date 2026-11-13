import DashboardShell from '../../components/dashboard/DashboardShell';

export default function ComptableDashboard() {
  return <DashboardShell role="COMPTABLE" title="Pilotage comptable" intro="Les opérations à traiter et les mouvements de votre exercice, en un coup d'œil." kpiConfig={[
    { key: 'ecrituresValidees', label: 'Écritures validées', tone: 'neutral' },
    { key: 'ecrituresEnAttente', label: 'Écritures à valider', tone: 'warning' },
    { key: 'facturesBrouillon', label: 'Factures en brouillon', tone: 'warning' },
    { key: 'paiements', label: 'Paiements de la période', tone: 'positive' },
  ]} links={[{ to: '/pieces/nouvelle', label: 'Nouvelle écriture' }, { to: '/factures', label: 'Voir les factures' }]} />;
}