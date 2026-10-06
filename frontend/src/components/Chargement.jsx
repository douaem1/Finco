export default function Chargement({ texte = 'Chargement…' }) {
  return (
    <div className="chargement" role="status">
      <span className="chargement-roue" aria-hidden="true" />
      <span>{texte}</span>
    </div>
  );
}
