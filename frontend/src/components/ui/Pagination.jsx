// Pagination supports server mode now and remains harmless for client-mode pilots.
export default function Pagination({ page, pageCount, onPageChange }) {
  if (!pageCount || pageCount <= 1) return null;
  return <nav className="ui-pagination" aria-label="Pagination"><button type="button" className="ui-pagination-button" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>Précédente</button><span>Page {page} sur {pageCount}</span><button type="button" className="ui-pagination-button" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount}>Suivante</button></nav>;
}