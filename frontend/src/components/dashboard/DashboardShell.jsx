import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDashboard } from '../../hooks/useDashboard';
import { formatMAD, formatPct } from '../../utils/format';
import MessageErreur from '../MessageErreur';
import KpiCard from './KpiCard';
import ChartCard from './ChartCard';

const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const PALETTE = ['#12A5A0', '#FF6B57', '#FFC53D', '#B79CFF', '#3567A8'];

function optionTendance(monthly) {
  return {
    color: PALETTE,
    tooltip: { trigger: 'axis', valueFormatter: (value) => `${formatMAD(value)} MAD` },
    legend: { bottom: 0 },
    grid: { left: 50, right: 20, top: 20, bottom: 50 },
    xAxis: { type: 'category', data: MOIS },
    yAxis: { type: 'value', axisLabel: { formatter: (value) => `${Math.round(value / 1000)}k` } },
    series: [
      { name: 'Produits', type: 'bar', data: monthly.map((m) => Number(m.revenue || 0)), itemStyle: { borderRadius: [5, 5, 0, 0] } },
      { name: 'Charges', type: 'bar', data: monthly.map((m) => Number(m.expenses || 0)), itemStyle: { borderRadius: [5, 5, 0, 0] } },
    ],
  };
}

function optionCentres(centres) {
  return {
    color: ['#12A5A0', '#FF6B57'],
    tooltip: { trigger: 'axis', valueFormatter: (value) => `${formatMAD(value)} MAD` },
    legend: { bottom: 0 },
    grid: { left: 80, right: 20, top: 20, bottom: 50 },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: centres.map((c) => c.code).reverse() },
    series: [
      { name: 'Budget', type: 'bar', data: centres.map((c) => Number(c.budget || 0)).reverse() },
      { name: 'Réel', type: 'bar', data: centres.map((c) => Number(c.actual || 0)).reverse() },
    ],
  };
}

function optionStatuts(statuses) {
  return {
    color: PALETTE,
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{ type: 'pie', radius: ['48%', '72%'], data: Object.entries(statuses || {}).map(([name, value]) => ({ name, value })) }],
  };
}

function optionRoles(usersByRole) {
  return {
    color: PALETTE,
    tooltip: { trigger: 'axis' },
    grid: { left: 120, right: 24, top: 20, bottom: 20 },
    xAxis: { type: 'value', minInterval: 1 },
    yAxis: { type: 'category', data: Object.keys(usersByRole || {}) },
    series: [{ name: 'Utilisateurs', type: 'bar', data: Object.values(usersByRole || {}), barWidth: 22, itemStyle: { borderRadius: [0, 5, 5, 0] } }],
  };
}

export default function DashboardShell({ role, title, intro, kpiConfig, links = [], children }) {
  const [filtres, setFiltres] = useState({});
  const { donnees, chargement, erreur, actualiseLe, actualiser } = useDashboard(role, filtres);
  const monthly = donnees?.monthly || [];
  const isControleur = role === 'CONTROLEUR';
  const isAdmin = role === 'ADMIN';
  const statuses = donnees?.invoiceStatuses || {};
  const chartTendance = useMemo(() => optionTendance(monthly), [monthly]);
  const chartCentres = useMemo(() => optionCentres(donnees?.centres || []), [donnees?.centres]);
  const chartStatuts = useMemo(() => optionStatuts(statuses), [statuses]);
  const chartRoles = useMemo(() => optionRoles(donnees?.usersByRole), [donnees?.usersByRole]);

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

      <MessageErreur message={erreur} />
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