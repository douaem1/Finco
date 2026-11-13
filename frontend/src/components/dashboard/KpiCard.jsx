import { formatMAD, formatPct } from '../../utils/format';

export default function KpiCard({ label, kpi, tone = 'neutral' }) {
  const variation = Number(kpi?.variationPct || 0);
  const favorable = tone === 'negative' ? variation <= 0 : variation >= 0;
  return (
    <article className={`dashboard-kpi dashboard-kpi-${tone}`}>
      <p className="dashboard-kpi-label">{label}</p>
      <strong>{formatMAD(kpi?.value)}</strong>
      <span className={favorable ? 'trend-favorable' : 'trend-defavorable'}>
        {variation >= 0 ? '↑' : '↓'} {formatPct(Math.abs(variation))} vs période précédente
      </span>
    </article>
  );
}