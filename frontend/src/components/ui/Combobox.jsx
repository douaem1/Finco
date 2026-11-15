import { useMemo, useState } from 'react';

// Searchable combobox: lightweight native listbox suitable for accounts and tiers.
export default function Combobox({ id, label, options, value, onChange, placeholder = 'Rechercher…' }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => options.filter((option) => `${option.label} ${option.value}`.toLowerCase().includes(query.toLowerCase())).slice(0, 8), [options, query]);
  const selected = options.find((option) => String(option.value) === String(value));
  return <div className="ui-combobox"><label className="ui-field-label" htmlFor={id}>{label}</label><input id={id} className="input" role="combobox" aria-controls={`${id}-list`} aria-expanded={query.length > 0} value={selected && !query ? selected.label : query} placeholder={placeholder} onChange={(event) => setQuery(event.target.value)} onFocus={() => setQuery('')} /><ul id={`${id}-list`} className="ui-combobox-list" role="listbox">{query && filtered.map((option) => <li key={option.value} role="option" aria-selected={String(option.value) === String(value)}><button type="button" onClick={() => { onChange(option.value); setQuery(''); }}>{option.label}</button></li>)}</ul></div>;
}