import DashboardShell from '../../components/dashboard/DashboardShell';

export default function AdminDashboard() {
  return <DashboardShell role="ADMIN" title="Gouvernance du système" intro="Surveillez les utilisateurs, le référentiel comptable et l'activité de la plateforme." kpiConfig={[
    { key: 'utilisateurs', label: 'Utilisateurs', tone: 'neutral' },
    { key: 'comptesGeneraux', label: 'Comptes généraux', tone: 'neutral' },
    { key: 'ecritures', label: 'Écritures validées', tone: 'positive' },
  ]} links={[{ to: '/utilisateurs', label: 'Gérer les utilisateurs' }, { to: '/comptes', label: 'Plan comptable' }]} />;
}