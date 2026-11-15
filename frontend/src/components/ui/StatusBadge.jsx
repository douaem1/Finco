const STATUS = {
  PRINCIPAL: ['Principal', 'positive', '●'],
  AUXILIAIRE: ['Auxiliaire', 'neutral', '○'],
  VALIDEE: ['Validée', 'positive', '✓'],
  BROUILLON: ['Brouillon', 'warning', '○'],
  PAYEE: ['Payée', 'positive', '✓'],
  REJETEE: ['Rejetée', 'negative', '×'],
  OUVERT: ['Ouverte', 'positive', '●'],
  CLOTURE: ['Clôturée', 'neutral', '●'],
};

// Status always includes text and a symbol; color is supplementary.
export default function StatusBadge({ status, label }) {
  const [defaultLabel, tone, icon] = STATUS[status] || [label || status, 'neutral', '•'];
  return <span className={`ui-status ui-status-${tone}`}><span aria-hidden="true">{icon}</span>{label || defaultLabel}</span>;
}