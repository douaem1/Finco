import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDashboard } from '../../hooks/useDashboard';
import { useTheme } from '../../context/ThemeContext';
import { formatMAD, formatPct } from '../../utils/format';
import MessageErreur from '../MessageErreur';
import KpiCard from './KpiCard';
import ChartCard from './ChartCard';

const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

/* Thème ECharts reconstruit depuis les variables CSS du thème courant
   (clair / sombre). Appelé au rendu et rejoué quand le thème résolu change. */
function themeGraphique() {
  if (typeof window === 'undefined') return null;
  const styles = getComputedStyle(document.documentElement);
  const lire = (nom, repli = '') => styles.getPropertyValue(nom).trim() || repli;
  const palette = ['--chart-series-1', '--chart-series-2', '--chart-series-3', '--chart-series-4', '--chart-series-5']
    .map((token) => lire(token));
  const texte = lire('--chart-texte', '#6B6455');
  const grille = lire('--chart-grille', 'rgba(34, 29, 22, 0.12)');
  const fond = lire('--surface-inversee', '#221D16');
  const texteInverse = lire('--texte-inverse', '#FBF6EC');
  return {
    color: palette,
    axis: {
      axisLine: { lineStyle: { color: grille } },
      axisTick: { lineStyle: { color: grille } },
      axisLabel: { color: texte },
      splitLine: { lineStyle: { color: grille } },
      nameTextStyle: { color: texte },
    },
    legend: { bottom: 0, textStyle: { color: texte } },
    tooltipSurfaces: {
      backgroundColor: fond,
      borderColor: grille,
      borderWidth: 1,
      textStyle: { color: texteInverse },
    },
  };
}

function optionTendance(monthly, th) {
  return {
    color: th.color.slice(0, 2),
    tooltip: { trigger: 'axis', valueFormatter: (value) => `${formatMAD(value)} MAD`, ...th.tooltipSurfaces },
    legend: th.legend,
    grid: { left: 50, right: 20, top: 20, bottom: 50 },
    xAxis: { type: 'category', data: MOIS, ...th.axis },
    yAxis: { type: 'value', axisLabel: { formatter: (value) => `${Math.round(value / 1000)}k`, color: th.axis.axisLabel.color }, ...th.axis },
    series: [
      { name: 'Produits', type: 'bar', data: monthly.map((m) => Number(m.revenue || 0)), itemStyle: { borderRadius: [5, 5, 0, 0] } },
      { name: 'Charges', type: 'bar', data: monthly.map((m) => Number(m.expenses || 0)), itemStyle: { borderRadius: [5, 5, 0, 0] } },
    ],
  };
}

function optionCentres(centres, th) {
  return {
    color: th.color.slice(0, 2),
    tooltip: { trigger: 'axis', valueFormatter: (value) => `${formatMAD(value)} MAD`, ...th.tooltipSurfaces },
    legend: th.legend,
    grid: { left: 80, right: 20, top: 20, bottom: 50 },
    xAxis: { type: 'value', ...th.axis },
    yAxis: { type: 'category', data: centres.map((c) => c.code).reverse(), ...th.axis },
    series: [
      { name: 'Budget', type: 'bar', data: centres.map((c) => Number(c.budget || 0)).reverse() },
      { name: 'Réel', type: 'bar', data: centres.map((c) => Number(c.actual || 0)).reverse() },
    ],
  };
}

function optionStatuts(statuses, th) {
  return {
    color: th.color,
    tooltip: { trigger: 'item', ...th.tooltipSurfaces },
    legend: th.legend,
    series: [{ type: 'pie', radius: ['48%', '72%'], data: Object.entries(statuses || {}).map(([name, value]) => ({ name, value })) }],
  };
}

function optionRoles(usersByRole, th) {
  return {
    color: th.color,
    tooltip: { trigger: 'axis', ...th.tooltipSurfaces },
    grid: { left: 120, right: 24, top: 20, bottom: 20 },
    xAxis: { type: 'value', minInterval: 1, ...th.axis },
    yAxis: { type: 'category', data: Object.keys(usersByRole || {}), ...th.axis },
    series: [{ name: 'Utilisateurs', type: 'bar', data: Object.values(usersByRole || {}), barWidth: 22, itemStyle: { borderRadius: [0, 5, 5, 0] } }],
  };
}

export default function DashboardShell({ role, title, intro, kpiConfig, links = [], children }) {
  const { resolved } = useTheme();
  const [filtres, setFiltres] = useState({});
  const { donnees, chargement, erreur, actualiseLe, actualiser } = useDashboard(role, filtres);
  const monthly = donnees?.monthly || [];
  const isControleur = role === 'CONTROLEUR';
  const isAdmin = role === 'ADMIN';
  const statuses = donnees?.invoiceStatuses || {};
  const theme = useMemo(() => themeGraphique(), [resolved]);
  const chartTendance = useMemo(() => (theme ? optionTendance(monthly, theme) : null), [monthly, theme]);
  const chartCentres = useMemo(() => (theme ? optionCentres(donnees?.centres || [], theme) : null), [donnees?.centres, theme]);
  const chartStatuts = useMemo(() => (theme ? optionStatuts(statuses, theme) : null), [statuses, theme]);
  const chartRoles = useMemo(() => (theme ? optionRoles(donnees?.usersByRole, theme) : null), [donnees?.usersByRole, theme]);

  function modifierFiltre(event) {
    setFiltres((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  return (
    <section className="dashboard-page">
      <header className="entete-page dashboard-header">
        <div><p className="date-du-jour">Analyse financière</p><h1>{title}</h1><p className="dashboard-intro">{intro}</p></div>
        <div className="dashboard-actions"><button type="button" className="btn btn-secondaire" onClick={actualiser}>Actualiser</button><span className="texte-secondaire">{actualiseLe ? `Mis à jour à ${actualiseLe.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : 'Chargement...'}</span></div>
      </header>

      <div className="dashboard-filtres" aria-label="Filtres du tableau de bord">
        <label className="champ"><span className="champ-label">Du</span><input className="input" type="date" name="dateFrom" onChange={modifierFiltre} /></label>
        <label className="champ"><span className="champ-label">Au</span><input className="input" type="date" name="dateTo" onChange={modifierFiltre} /></label>
      </div>

      <MessageErreur message={erreur} onRetry={actualiser} />
      {chargement && !donnees ? <div className="dashboard-skeleton dashboard-skeleton-large" /> : donnees && (
        <>
          <div className="dashboard-kpi-grid">
            {kpiConfig.map(({ key, label, tone }) => <KpiCard key={key} label={label} tone={tone} kpi={donnees.kpis?.[key]} />)}
          </div>
          <div className="dashboard-chart-grid">
            {!isAdmin && <ChartCard title="Tendance mensuelle" subtitle="Produits et charges validés" option={chartTendance} />}
            {!isControleur && <ChartCard title="Répartition des factures" subtitle="Tous statuts confondus" option={chartStatuts} empty={!Object.keys(statuses).length} />}
            {isControleur && <ChartCard title="Budget par centre de coûts" subtitle="Comparaison du prévu et du réel" option={chartCentres} empty={!donnees.centres?.length} />}
            {isAdmin && <ChartCard title="Utilisateurs par rôle" subtitle="Répartition des accès au système" option={chartRoles} empty={!Object.keys(donnees.usersByRole || {}).length} />}
          </div>
          {isControleur && <div className="dashboard-centre-list">{(donnees.centres || []).map((centre) => <Link className="dashboard-centre-row" key={centre.id} to={`/centres-cout`}><span><b>{centre.code}</b> {centre.label}</span><span>{formatMAD(centre.actual)} / {formatMAD(centre.budget)} MAD</span><strong className={centre.variance > 0 ? 'trend-defavorable' : 'trend-favorable'}>{formatPct(centre.consumptionPct)}%</strong></Link>)}</div>}
          {links.length > 0 && <nav className="dashboard-quick-links" aria-label="Accès rapides">{links.map((link) => <Link className="btn btn-secondaire" to={link.to} key={link.to}>{link.label}</Link>)}</nav>}
          {children}
        </>
      )}
    </section>
  );
}