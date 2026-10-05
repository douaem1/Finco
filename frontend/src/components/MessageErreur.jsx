/** Affiche le message d'erreur renvoyé par le serveur. */
export default function MessageErreur({ message, onFermer }) {
  if (!message) return null;
  return (
    <div className="f-alerte" role="alert">
      <span className="f-alerte-icone" aria-hidden="true">!</span>
      <p>{message}</p>
      {onFermer && (
        <button type="button" className="f-alerte-fermer" onClick={onFermer} aria-label="Fermer">×</button>
      )}
    </div>
  );
}
