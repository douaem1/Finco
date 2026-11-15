// Search toolbar: keeps list search and result count aligned across pages.
export default function SearchToolbar({ value, onChange, placeholder, resultCount, children }) {
  return <div className="ui-search-toolbar"><label className="recherche"><span className="visuellement-cache">Rechercher</span><input type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder || 'Rechercher'} /></label><span className="texte-secondaire">{resultCount}</span>{children}</div>;
}