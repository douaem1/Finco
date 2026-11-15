// Empty state: explains what the user can do next instead of showing a blank panel.
export default function EmptyState({ title = 'Aucune donnée', description, action }) {
  return <div className="ui-empty-state"><strong>{title}</strong>{description && <p className="texte-secondaire">{description}</p>}{action}</div>;
}