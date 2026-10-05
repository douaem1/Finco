export default function Chargement({ texte = 'Chargement…' }) {
  return (
    <div className="f-chargement" role="status">
      <span className="f-chargement-point" /><span className="f-chargement-point" /><span className="f-chargement-point" />
      <span>{texte}</span>
    </div>
  );
}
