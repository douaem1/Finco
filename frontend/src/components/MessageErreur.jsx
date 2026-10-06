/** Affiche le message d'erreur renvoyé par le serveur. */
export default function MessageErreur({ message, onFermer }) {
  if (!message) return null;
  return (
    <div className="alerte" role="alert">
      <svg className="alerte-icone" viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <path d="M10 5.5v5.5M10 13.6v.9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <p>{message}</p>
      {onFermer && (
        <button type="button" className="alerte-fermer" onClick={onFermer} aria-label="Fermer le message">×</button>
      )}
    </div>
  );
}
