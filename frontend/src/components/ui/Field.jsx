// Shared labelled field: keeps hint/error relationships accessible.
export default function Field({ id, label, required = false, hint, error, children }) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  return (
    <div className="ui-field">
      <label className="ui-field-label" htmlFor={id}>{label}{required && <span className="obligatoire"> *</span>}</label>
      {children({ id, 'aria-invalid': error ? 'true' : undefined, 'aria-describedby': describedBy, required: required || undefined })}
      {error ? <span id={`${id}-error`} className="ui-field-error" role="alert">{error}</span> : hint && <span id={`${id}-hint`} className="ui-field-hint">{hint}</span>}
    </div>
  );
}