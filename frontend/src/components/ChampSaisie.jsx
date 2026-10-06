/** Champ de formulaire réutilisable : libellé + input. */
export default function ChampSaisie({ id, label, aide, ...props }) {
  return (
    <div className="champ">
      <label className="champ-label" htmlFor={id}>{label}</label>
      <input id={id} className="input" {...props} />
      {aide && <span className="champ-aide">{aide}</span>}
    </div>
  );
}
