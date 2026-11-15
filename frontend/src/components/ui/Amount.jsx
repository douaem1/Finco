import { formatMAD } from '../../utils/format';

// Montant financier : chiffres tabulaires, devise discrète et alignement à droite.
export default function Amount({ value, className = '', devise = true }) {
  const texte = formatMAD(value);
  if (!devise) return <span className={`ui-amount chiffres ${className}`.trim()}>{texte}</span>;
  const separateur = texte.lastIndexOf(' ');
  const nombre = separateur > 0 ? texte.slice(0, separateur) : texte;
  const suffixe = separateur > 0 ? texte.slice(separateur + 1) : 'MAD';
  return <span className={`ui-amount chiffres ${className}`.trim()}>{nombre}<span className="ui-devise">{suffixe}</span></span>;
}

export function MoneyCell({ value, className = '' }) {
  return <td className={`num ${className}`}><Amount value={value} /></td>;
}
