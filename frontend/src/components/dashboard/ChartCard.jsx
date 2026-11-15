import ReactECharts from 'echarts-for-react/lib/core';
import echarts from './echartsSetup';

export default function ChartCard({ title, subtitle, option, loading = false, empty = false }) {
  return (
    <article className="carte dashboard-chart-card">
      <header className="carte-entete">
        <div>
          <h2>{title}</h2>
          {subtitle && <p className="texte-secondaire dashboard-subtitle">{subtitle}</p>}
        </div>
      </header>
      {loading ? <div className="dashboard-skeleton" aria-label="Chargement du graphique" /> : empty ? (
        <p className="texte-secondaire carte-vide">Aucune donnée pour cette période.</p>
      ) : <ReactECharts echarts={echarts} option={option} notMerge lazyUpdate style={{ height: 300, width: '100%' }} />}
    </article>
  );
}