import { useEffect, useId, useMemo, useRef, useState } from 'react';

/* ============================================================
   Combobox accessible : champ de recherche + liste filtrée.
   - filtrage au fil de la frappe ;
   - clavier : Flèches haut/bas, Entrée, Échap, Début/Fin ;
   - ARIA combobox + listbox + aria-activedescendant ;
   - fermeture au clic extérieur et au changement de focus.
   options : [{ value, label }]
   ============================================================ */
export default function Combobox({
  id,
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Rechercher…',
  hint,
  error,
  disabled = false,
  required = false,
  vide = '',
  maxResultats = 60,
}) {
  const genId = useId().replace(/:/g, '');
  const inputId = id || `combobox-${genId}`;
  const listId = `${inputId}-list`;
  const optionId = (index) => `${inputId}-option-${index}`;

  const [ouvert, setOuvert] = useState(false);
  const [requete, setRequete] = useState('');
  const [indexActif, setIndexActif] = useState(-1);
  const conteneur = useRef(null);

  const selection = options.find((o) => String(o.value) === String(value));

  const resultats = useMemo(() => {
    const q = requete.trim().toLowerCase();
    const base = q ? options.filter((o) => `${o.label} ${o.value}`.toLowerCase().includes(q)) : options;
    return base.slice(0, maxResultats);
  }, [options, requete, maxResultats]);

  useEffect(() => {
    if (!ouvert) return undefined;
    function auClic(e) {
      if (conteneur.current && !conteneur.current.contains(e.target)) {
        setOuvert(false);
        setRequete('');
        setIndexActif(-1);
      }
    }
    document.addEventListener('mousedown', auClic);
    return () => document.removeEventListener('mousedown', auClic);
  }, [ouvert]);

  function choisir(valeur) {
    onChange(valeur);
    setOuvert(false);
    setRequete('');
    setIndexActif(-1);
  }

  function auClavier(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!ouvert) { setOuvert(true); setIndexActif(0); return; }
      setIndexActif((i) => Math.min(i + 1, resultats.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndexActif((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Home') {
      if (ouvert) { e.preventDefault(); setIndexActif(0); }
    } else if (e.key === 'End') {
      if (ouvert) { e.preventDefault(); setIndexActif(resultats.length - 1); }
    } else if (e.key === 'Enter') {
      if (ouvert && indexActif >= 0 && resultats[indexActif]) {
        e.preventDefault();
        choisir(resultats[indexActif].value);
      }
    } else if (e.key === 'Escape') {
      if (ouvert) { e.preventDefault(); setOuvert(false); setRequete(''); setIndexActif(-1); }
    }
  }

  const texteAffiche = ouvert ? requete : (selection ? selection.label : '');
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="ui-combobox" ref={conteneur}>
      {label && (
        <label className="ui-field-label" htmlFor={inputId}>
          {label}{required && <span className="obligatoire"> *</span>}
        </label>
      )}
      <div className="ui-combobox-champ">
        <input
          id={inputId}
          className={`input ${error ? 'input-erreur' : ''}`}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-expanded={ouvert}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={ouvert && indexActif >= 0 ? optionId(indexActif) : undefined}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          disabled={disabled}
          value={texteAffiche}
          placeholder={placeholder}
          onChange={(e) => { setRequete(e.target.value); setOuvert(true); setIndexActif(0); }}
          onFocus={() => { setOuvert(true); setRequete(''); }}
          onKeyDown={auClavier}
        />
        {ouvert && (
          <ul id={listId} className="ui-combobox-list" role="listbox" aria-label={label}>
            {vide && !requete && (
              <li role="option" aria-selected={String(value) === '' || value == null}>
                <button type="button" className="ui-combobox-option" onClick={() => choisir('')}>{vide}</button>
              </li>
            )}
            {resultats.length === 0 ? (
              <li className="ui-combobox-vide" role="presentation">Aucun résultat</li>
            ) : resultats.map((option, i) => (
              <li
                key={String(option.value)}
                id={optionId(i)}
                role="option"
                aria-selected={String(option.value) === String(value)}
                className={i === indexActif ? 'ui-combobox-actif' : ''}
              >
                <button
                  type="button"
                  className="ui-combobox-option"
                  tabIndex={-1}
                  onMouseEnter={() => setIndexActif(i)}
                  onClick={() => choisir(option.value)}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error
        ? <span id={`${inputId}-error`} className="ui-field-error" role="alert">{error}</span>
        : hint && <span id={`${inputId}-hint`} className="ui-field-hint">{hint}</span>}
    </div>
  );
}
