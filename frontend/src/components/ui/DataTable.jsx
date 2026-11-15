import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import Tooltip from './Tooltip';
import Icone from '../Icone';

/* ==================================================================
   État partagé (module) : densité globale + colonnes visibles par tableau.
   Aucune dépendance ajoutée ; persistance localStorage protégée par try/catch.
   ================================================================== */

function lireStockage(cle) {
  try { return localStorage.getItem(cle); } catch { return null; }
}
function ecrireStockage(cle, valeur) {
  try { localStorage.setItem(cle, valeur); } catch { /* stockage indisponible */ }
}

const CLE_DENSITE = 'finco-densite';
const PREFIXE_COLONNES = 'finco-colonnes:';

function creerEmetteur(valeur) {
  return {
    valeur,
    abonnes: new Set(),
    ecouter(abonne) { this.abonnes.add(abonne); return () => this.abonnes.delete(abonne); },
    definir(valeur) { this.valeur = valeur; this.abonnes.forEach((a) => a()); },
  };
}

/* densité : une seule instance pour toute l'application (clé « finco-densite »). */
const densiteStore = (() => {
  const initiale = lireStockage(CLE_DENSITE) === 'compact' ? 'compact' : 'confortable';
  const store = creerEmetteur(initiale);
  const definir = store.definir.bind(store);
  store.definir = (valeur) => {
    ecrireStockage(CLE_DENSITE, valeur === 'compact' ? 'compact' : 'confortable');
    definir(valeur === 'compact' ? 'compact' : 'confortable');
  };
  return store;
})();

/* colonnes masquées : une instance par storageKey de tableau. */
const colonnesStores = new Map();
function colonnesStore(storageKey) {
  const cle = storageKey || '__defaut__';
  if (colonnesStores.has(cle)) return colonnesStores.get(cle);
  let masquees = [];
  const brut = lireStockage(PREFIXE_COLONNES + cle);
  if (brut) {
    try { const lu = JSON.parse(brut); if (Array.isArray(lu)) masquees = lu; } catch { masquees = []; }
  }
  const store = creerEmetteur(new Set(masquees));
  const definir = store.definir.bind(store);
  store.basculer = (colonneCle) => {
    const suivant = new Set(store.valeur);
    if (suivant.has(colonneCle)) suivant.delete(colonneCle); else suivant.add(colonneCle);
    ecrireStockage(PREFIXE_COLONNES + cle, JSON.stringify([...suivant]));
    definir(suivant);
  };
  colonnesStores.set(cle, store);
  return store;
}

/* Abonnement à un émetteur : force le rendu à chaque notification. */
function useEmetteur(store) {
  const [, forcer] = useState(0);
  useEffect(() => store.ecouter(() => forcer((n) => n + 1)), [store]);
  return store.valeur;
}

/** Densité globale : [« confortable » | « compact », setter]. */
export function useDensite() {
  const densite = useEmetteur(densiteStore);
  return [densite, (valeur) => densiteStore.definir(valeur)];
}

/* ==================================================================
   Cellules
   ================================================================== */

/** Cellule à deux lignes : ligne principale + ligne secondaire discrète. */
export function Cellule({ principal, secondaire, className = '' }) {
  const seconde = secondaire != null && secondaire !== '' && secondaire !== false;
  return (
    <span className={`ui-cellule ${className}`.trim()}>
      <span className="ui-cellule-principal">{principal}</span>
      {seconde && <span className="ui-cellule-secondaire">{secondaire}</span>}
    </span>
  );
}

/** Texte sur une ligne tronquée, infobulle avec le contenu complet. */
function CelluleTronquee({ texte, children }) {
  return (
    <Tooltip label={texte} side="top">
      <span className="ui-tronque">{children}</span>
    </Tooltip>
  );
}

function rendreContenu(colonne, ligne) {
  if (colonne.render) return colonne.render(ligne);
  if (colonne.cell) {
    const resultat = colonne.cell(ligne);
    if (resultat && typeof resultat === 'object' && !resultat.$$typeof
      && ('principal' in resultat || 'secondaire' in resultat)) {
      return <Cellule principal={resultat.principal} secondaire={resultat.secondaire} />;
    }
    return resultat;
  }
  const valeur = ligne[colonne.key];
  if (colonne.truncate && typeof valeur === 'string' && valeur) {
    return <CelluleTronquee texte={valeur}>{valeur}</CelluleTronquee>;
  }
  return valeur;
}

/* ==================================================================
   Boutons d'outillage réutilisables (à poser dans SearchToolbar)
   ================================================================== */

/** Bascule Confortable / Compact, persistée sous « finco-densite ». */
export function BasculeDensite() {
  const [densite, changer] = useDensite();
  return (
    <div className="ui-densite" role="group" aria-label="Densité d'affichage">
      <button
        type="button"
        className={`ui-densite-btn${densite === 'confortable' ? ' actif' : ''}`}
        aria-pressed={densite === 'confortable'}
        onClick={() => changer('confortable')}
      >
        <Icone nom="aere" taille={16} />
        <span className="visuellement-cache">Confortable</span>
      </button>
      <button
        type="button"
        className={`ui-densite-btn${densite === 'compact' ? ' actif' : ''}`}
        aria-pressed={densite === 'compact'}
        onClick={() => changer('compact')}
      >
        <Icone nom="dense" taille={16} />
        <span className="visuellement-cache">Compact</span>
      </button>
    </div>
  );
}

/** Menu « Colonnes » : cases à cocher, persistées par `storageKey`. */
export function MenuColonnes({ storageKey, colonnes = [], className = '' }) {
  const store = useMemo(() => colonnesStore(storageKey), [storageKey]);
  const masquees = useEmetteur(store);
  const basculables = colonnes.filter((c) => c && c.key && c.label && c.masquable !== false);
  if (basculables.length === 0) return null;
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button type="button" className={`ui-outils-btn ${className}`.trim()} aria-haspopup="menu" aria-label="Colonnes affichées">
          <Icone nom="colonnes" taille={16} />
          <span className="ui-outils-btn-texte">Colonnes</span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="ui-colonnes-menu" align="end" sideOffset={6} collisionPadding={12}>
          <DropdownMenu.Label className="ui-colonnes-titre">Colonnes affichées</DropdownMenu.Label>
          {basculables.map((colonne) => (
            <DropdownMenu.CheckboxItem
              key={colonne.key}
              className="ui-colonnes-item"
              checked={!masquees.has(colonne.key)}
              onCheckedChange={() => store.basculer(colonne.key)}
              onSelect={(e) => e.preventDefault()}
            >
              <DropdownMenu.ItemIndicator className="ui-colonnes-indicateur"><Icone nom="coche" taille={14} /></DropdownMenu.ItemIndicator>
              <span>{colonne.label}</span>
            </DropdownMenu.CheckboxItem>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

/** Menu « ⋯ » des actions de ligne : action principale visible, reste en menu. */
export function MenuActionsLigne({ actions = [], label = 'Actions de la ligne', className = '' }) {
  const liste = actions.filter(Boolean);
  if (liste.length === 0) return null;
  const principales = liste.filter((a) => a.principale);
  const secondaires = liste.filter((a) => !a.principale);
  return (
    <span className={`ui-actions-ligne ${className}`.trim()}>
      {principales.map((action, index) => (
        <button
          key={`p-${index}`}
          type="button"
          className="ui-actions-principal"
          disabled={action.desactive}
          onClick={(e) => { e.stopPropagation(); action.onSelect?.(); }}
        >
          {action.icone && <Icone nom={action.icone} taille={16} />}
          <span>{action.label}</span>
        </button>
      ))}
      {secondaires.length > 0 && (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className="ui-actions-trigger"
              aria-label={label}
              aria-haspopup="menu"
              onClick={(e) => e.stopPropagation()}
            >
              ⋯
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="ui-actions-menu" align="end" sideOffset={6} collisionPadding={12}>
              {secondaires.map((action, index) => (
                <Fragment key={`s-${index}`}>
                  {action.separateurAvant && <DropdownMenu.Separator className="ui-actions-separateur" />}
                  <DropdownMenu.Item
                    className={`ui-actions-item${action.danger ? ' ui-actions-item-danger' : ''}`}
                    disabled={action.desactive}
                    onSelect={() => action.onSelect?.()}
                  >
                    {action.icone && <span className="ui-actions-item-icone" aria-hidden="true"><Icone nom={action.icone} taille={16} /></span>}
                    <span>{action.label}</span>
                  </DropdownMenu.Item>
                </Fragment>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )}
    </span>
  );
}

/* ==================================================================
   DataTable
   ================================================================== */

function classesPriorite(colonne) {
  const priorite = colonne.priorite || 1;
  return priorite === 3 ? 'ui-col-p3' : priorite === 2 ? 'ui-col-p2' : 'ui-col-p1';
}

function largeurMin(colonne) {
  return Number(colonne.largeurMin) || Number(colonne.largeur) || 130;
}

/**
 * Tableau de données : tri client, densité partagée, priorités de colonnes,
 * troncature avec infobulle, menu d'actions par ligne et ligne de détail
 * dépliable (colonnes secondaires masquées restent accessibles).
 */
export default function DataTable({
  columns,
  rows,
  rowKey = 'id',
  mode = 'client',
  onSort,
  onRowClick,
  empty,
  loading = false,
  storageKey,
  densite,
  detail,
  grouper,
}) {
  const [sort, setSort] = useState({ key: '', direction: 'asc' });
  const [ligneOuverte, setLigneOuverte] = useState(null);
  const [densiteGlobale] = useDensite();
  const densiteActive = densite || densiteGlobale;
  const store = useMemo(() => colonnesStore(storageKey), [storageKey]);
  const masquees = useEmetteur(store);

  const visibles = useMemo(() => columns.filter((c) => !masquees.has(c.key)), [columns, masquees]);

  const largeurMinimale = useMemo(
    () => visibles.reduce((total, c) => total + largeurMin(c), 0),
    [visibles],
  );

  const donnees = useMemo(() => {
    if (mode === 'server' || !sort.key) return rows;
    return [...rows].sort((a, b) => String(a[sort.key] ?? '').localeCompare(String(b[sort.key] ?? ''), 'fr', { numeric: true }) * (sort.direction === 'asc' ? 1 : -1));
  }, [mode, rows, sort]);

  /* Enchaînement à plat : éventuel en-tête de groupe puis la ligne. */
  const elements = useMemo(() => {
    if (!grouper) return donnees.map((ligne, index) => ({ type: 'ligne', ligne, cle: `l-${ligne[rowKey] ?? index}` }));
    const sortie = [];
    let cleGroupe;
    donnees.forEach((ligne, index) => {
      const groupe = grouper(ligne);
      if (groupe && groupe.cle !== cleGroupe) {
        cleGroupe = groupe.cle;
        sortie.push({ type: 'groupe', contenu: groupe.contenu, cle: `g-${groupe.cle}-${index}` });
      }
      sortie.push({ type: 'ligne', ligne, cle: `l-${ligne[rowKey] ?? index}-${index}` });
    });
    return sortie;
  }, [donnees, grouper, rowKey]);

  function changeSort(colonne) {
    if (!colonne.sortable) return;
    const direction = sort.key === colonne.key && sort.direction === 'asc' ? 'desc' : 'asc';
    setSort({ key: colonne.key, direction });
    onSort?.(colonne.key, direction);
  }
  function activerLigne(ligne, evenement) {
    if (evenement.target.closest('a, button, input, select')) return;
    onRowClick(ligne);
  }
  function clavierLigne(ligne, evenement) {
    if (evenement.key !== 'Enter' && evenement.key !== ' ') return;
    evenement.preventDefault();
    onRowClick(ligne);
  }

  const refScroll = useRef(null);
  const [debordement, setDebordement] = useState({ gauche: false, droite: false });
  useEffect(() => {
    const noeud = refScroll.current;
    if (!noeud) return undefined;
    function majDebordement() {
      const gauche = noeud.scrollLeft > 1;
      const droite = noeud.scrollLeft + noeud.clientWidth < noeud.scrollWidth - 1;
      setDebordement((prec) => (prec.gauche === gauche && prec.droite === droite ? prec : { gauche, droite }));
    }
    majDebordement();
    noeud.addEventListener('scroll', majDebordement, { passive: true });
    window.addEventListener('resize', majDebordement);
    return () => {
      noeud.removeEventListener('scroll', majDebordement);
      window.removeEventListener('resize', majDebordement);
    };
  }, [visibles, densiteActive]);

  const colonnesColspan = visibles.length + (detail ? 1 : 0);
  const classesTable = `ui-table ui-table-${densiteActive}${debordement.gauche ? ' ui-table-deborde-gauche' : ''}${debordement.droite ? ' ui-table-deborde-droite' : ''}`;

  return (
    <div className="ui-table-wrap" ref={refScroll}>
      <table className={classesTable} style={{ minWidth: `${largeurMinimale}px` }}>
        <thead>
          <tr>
            {detail && <th scope="col" className="ui-col-detail" aria-label="Détail" />}
            {visibles.map((colonne) => {
              const premiere = colonne === visibles[0] && !detail;
              return (
                <th
                  key={colonne.key}
                  scope="col"
                  style={colonne.largeur ? { width: `${colonne.largeur}px` } : undefined}
                  className={[
                    classesPriorite(colonne),
                    colonne.numeric || colonne.align === 'right' ? 'num' : '',
                    colonne.center || colonne.align === 'center' ? 'centre' : '',
                    colonne.actions ? 'ui-col-actions' : '',
                    premiere ? 'ui-col-premiere' : '',
                  ].filter(Boolean).join(' ')}
                >
                  <button type="button" className={colonne.sortable ? 'ui-sort-button' : 'ui-sort-button ui-sort-static'} onClick={() => changeSort(colonne)}>
                    {colonne.label}
                    {colonne.sortable && <span aria-hidden="true">{sort.key === colonne.key ? (sort.direction === 'asc' ? ' ↑' : ' ↓') : ' ↕'}</span>}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <tr key={`squelette-${index}`} className="ui-table-squelette">
                {detail && <td className="ui-col-detail" />}
                {visibles.map((colonne, ci) => (
                  <td key={colonne.key} className={colonne.actions ? 'ui-col-actions' : ''}>
                    <span className="ui-squelette" style={{ width: ci === 0 ? '70%' : '55%' }} />
                  </td>
                ))}
              </tr>
            ))
          ) : donnees.length === 0 ? (
            <tr><td colSpan={colonnesColspan} className="ui-table-message">{empty || 'Aucune donnée pour cette recherche.'}</td></tr>
          ) : elements.map((element) => {
            if (element.type === 'groupe') {
              return (
                <tr className="ui-table-groupe" key={element.cle}>
                  <th scope="colgroup" colSpan={colonnesColspan}>{element.contenu}</th>
                </tr>
              );
            }
            const ligne = element.ligne;
            const cle = ligne[rowKey];
            const ouvert = ligneOuverte === cle;
            return (
              <Fragment key={element.cle}>
                <tr
                  className={`${onRowClick ? 'ui-table-ligne-cliquable' : ''}${ouvert ? ' ui-table-ligne-ouverte' : ''}`.trim() || undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={onRowClick ? (e) => activerLigne(ligne, e) : undefined}
                  onKeyDown={onRowClick ? (e) => clavierLigne(ligne, e) : undefined}
                >
                  {detail && (
                    <td className="ui-col-detail">
                      <button
                        type="button"
                        className={`ui-detail-trigger${ouvert ? ' ouvert' : ''}`}
                        aria-expanded={ouvert}
                        aria-label={ouvert ? 'Masquer le détail' : 'Afficher le détail'}
                        onClick={(e) => { e.stopPropagation(); setLigneOuverte(ouvert ? null : cle); }}
                      >
                        <Icone nom="flecheBas" taille={16} />
                      </button>
                    </td>
                  )}
                  {visibles.map((colonne) => (
                    <td
                      key={colonne.key}
                      className={[
                        classesPriorite(colonne),
                        colonne.numeric || colonne.align === 'right' ? 'num chiffres' : '',
                        colonne.center || colonne.align === 'center' ? 'centre' : '',
                        colonne.nowrap ? 'ui-nowrap' : '',
                        colonne.actions ? 'ui-col-actions' : '',
                      ].filter(Boolean).join(' ')}
                    >
                      {rendreContenu(colonne, ligne)}
                    </td>
                  ))}
                </tr>
                {detail && ouvert && (
                  <tr className="ui-table-detail">
                    <td colSpan={colonnesColspan}>{detail(ligne)}</td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
