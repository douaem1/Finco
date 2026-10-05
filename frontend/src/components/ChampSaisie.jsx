/** Champ de formulaire réutilisable : libellé + input. */
export default function ChampSaisie({ id, label, aide, ...props }) {
  return (
    <label className="f-champ" htmlFor={id}>
      <span className="f-champ-label">{label}</span>
      <input id={id} className="f-input" {...props} />
      {aide && <span className="f-champ-aide">{aide}</span>}
    </label>
  );
}
