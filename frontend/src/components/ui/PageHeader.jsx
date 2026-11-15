// Shared page heading for consistent hierarchy and primary action placement.
export default function PageHeader({ title, description, actions }) {
  return <header className="ui-page-header"><div><h1>{title}</h1>{description && <p className="texte-secondaire">{description}</p>}</div>{actions && <div className="ui-page-actions">{actions}</div>}</header>;
}