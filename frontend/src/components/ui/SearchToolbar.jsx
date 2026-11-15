// Barre d'outils de liste : recherche, compteur, filtres, puces actives,
// et zone d'outillage alignée à droite (densité, colonnes, export).
export default function SearchToolbar({
  value,
  onChange,
  placeholder,
  resultCount,
  chips,
  onReset,
  actions,
  children,
}) {
  const aDesPuces = Array.isArray(chips) && chips.length > 0;
  return (
    <div className="ui-search-toolbar">
      <label className="recherche">
        <span className="visuellement-cache">Rechercher</span>
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-label={placeholder || 'Rechercher'}
        />
      </label>
      {resultCount && <span className="ui-search-toolbar-resultat">{resultCount}</span>}
      {children}
      {aDesPuces && (
        <div className="ui-search-chips">
          {chips.map((puce, index) => (
            <span className="ui-chip" key={`${puce.label}-${index}`}>
              {puce.label}
              <button type="button" onClick={puce.onRemove} aria-label={`Retirer le filtre ${puce.label}`}>
                <span aria-hidden="true">×</span>
              </button>
            </span>
          ))}
          {onReset && <button type="button" className="ui-chip-reinit" onClick={onReset}>Réinitialiser</button>}
        </div>
      )}
      {actions && <div className="ui-search-toolbar-actions">{actions}</div>}
    </div>
  );
}
