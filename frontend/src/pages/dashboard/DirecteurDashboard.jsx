import DashboardShell from '../../components/dashboard/DashboardShell';
import { DirecteurLegacyWidgets } from '../../components/dashboard/LegacyDashboardWidgets';

export default function DirecteurDashboard() {
  return <DashboardShell role="DIRECTEUR_FINANCIER" title="Direction financière" intro="Une lecture exécutive du résultat, des charges et des décisions en attente." kpiConfig={[
    { key: 'revenus', label: 'Chiffre d’affaires', tone: 'positive' },
    { key: 'charges', label: 'Charges', tone: 'negative' },
    { key: 'resultatNet', label: 'Résultat net', tone: 'positive' },
    { key: 'paiementsEnAttente', label: 'Paiements à valider', tone: 'warning' },
    { key: 'tresorerie', label: 'Trésorerie', tone: 'positive' },
    { key: 'creancesClients', label: 'Créances clients', tone: 'neutral' },
    { key: 'dettesFournisseurs', label: 'Dettes fournisseurs', tone: 'negative' },
  ]} links={[{ to: '/validation-paiements', label: 'Valider les paiements' }]}><DirecteurLegacyWidgets /></DashboardShell>;
}