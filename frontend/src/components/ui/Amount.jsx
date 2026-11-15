import { formatMAD } from '../../utils/format';

// Financial amount display: tabular numerals and right alignment are deliberate.
export default function Amount({ value, className = '' }) {
  return <span className={`ui-amount chiffres ${className}`}>{formatMAD(value)}</span>;
}

export function MoneyCell({ value, className = '' }) {
  return <td className={`num ${className}`}><Amount value={value} /></td>;
}