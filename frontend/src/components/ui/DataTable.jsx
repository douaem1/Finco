import { useMemo, useState } from 'react';

// Data table: client sorting today, server mode ready through the onSort callback.
export default function DataTable({ columns, rows, rowKey = 'id', mode = 'client', onSort, empty, loading = false }) {
  const [sort, setSort] = useState({ key: '', direction: 'asc' });
  const visibleRows = useMemo(() => {
    if (mode === 'server' || !sort.key) return rows;
    return [...rows].sort((a, b) => String(a[sort.key] ?? '').localeCompare(String(b[sort.key] ?? ''), 'fr', { numeric: true }) * (sort.direction === 'asc' ? 1 : -1));
  }, [mode, rows, sort]);
  function changeSort(column) {
    if (!column.sortable) return;
    const direction = sort.key === column.key && sort.direction === 'asc' ? 'desc' : 'asc';
    setSort({ key: column.key, direction });
    onSort?.(column.key, direction);
  }
  return <div className="ui-table-wrap"><table className="ui-table"><thead><tr>{columns.map((column) => <th key={column.key} scope="col" className={column.numeric ? 'num' : ''}><button type="button" className={column.sortable ? 'ui-sort-button' : 'ui-sort-button ui-sort-static'} onClick={() => changeSort(column)}>{column.label}{column.sortable && <span aria-hidden="true">{sort.key === column.key ? (sort.direction === 'asc' ? ' ↑' : ' ↓') : ' ↕'}</span>}</button></th>)}</tr></thead><tbody>{loading ? <tr><td colSpan={columns.length} className="ui-table-message">Chargement…</td></tr> : visibleRows.length === 0 ? <tr><td colSpan={columns.length} className="ui-table-message">{empty || 'Aucune donnée pour cette recherche.'}</td></tr> : visibleRows.map((row) => <tr key={row[rowKey]}>{columns.map((column) => <td key={column.key} className={column.numeric ? 'num chiffres' : ''}>{column.render ? column.render(row) : row[column.key]}</td>)}</tr>)}</tbody></table></div>;
}