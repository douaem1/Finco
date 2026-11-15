// Pagination serveur : sélecteur de lignes par page + compteur « x–y sur N ».
export default function Pagination({
  page = 1,
  pageCount = 1,
  onPageChange,
  total,
  taille,
  onTailleChange,
  tailles = [10, 25, 50],
}) {
  const parPage = taille ?? 0;
  const debut = total != null && parPage ? (page - 1) * parPage + 1 : null;
  const fin = total != null && parPage ? Math.min(page * parPage, total) : null;
  const libelle = (debut != null && fin != null && total != null)
    ? `${debut}–${fin} sur ${total}`
    : `Page ${page} sur ${pageCount}`;

  const afficherSelecteur = typeof onTailleChange === 'function';
  if (!afficherSelecteur && (!pageCount || pageCount <= 1)) return null;

  return (
    <nav className={`ui-pagination${afficherSelecteur ? '' : ' ui-pagination-simple'}`} aria-label="Pagination">
      {afficherSelecteur && (
        <label className="ui-pagination-taille">
          <span>Lignes par page</span>
          <select
            value={parPage || tailles[0]}
            onChange={(event) => onTailleChange(Number(event.target.value))}
          >
            {tailles.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      )}
      <span className="ui-pagination-nav">
        <button type="button" className="ui-pagination-button" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>Précédente</button>
        <span aria-live="polite">{libelle}</span>
        <button type="button" className="ui-pagination-button" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount}>Suivante</button>
      </span>
    </nav>
  );
}
