/**
 * Champ de formulaire réutilisable : libellé + input.
 * - aide   : texte d'aide affiché sous le champ ;
 * - erreur : message (du serveur) affiché à la place de l'aide, champ encadré en rouge.
 */
export default function ChampSaisie({ id, label, aide, erreur, obligatoire, ...props }) {
  return (
    <div className="champ">
      <label className="champ-label" htmlFor={id}>
        {label}{obligatoire && <span style={{ color: 'var(--corail)' }}> *</span>}
      </label>
      <input id={id} className={`input ${erreur ? 'input-erreur' : ''}`} aria-invalid={erreur ? true : undefined}
        required={obligatoire || undefined} {...props} />
      {erreur
        ? <span className="champ-erreur">{erreur}</span>
        : aide && <span className="champ-aide">{aide}</span>}
    </div>
  );
}
