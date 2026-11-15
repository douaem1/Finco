import { forwardRef } from 'react';

// Shared action button: variants keep financial actions visually predictable.
const Button = forwardRef(function Button({ variant = 'primary', loading = false, children, disabled, ...props }, ref) {
  return (
    <button ref={ref} className={`ui-button ui-button-${variant}`} disabled={disabled || loading} {...props}>
      {loading && <span className="ui-spinner" aria-hidden="true" />}
      <span>{children}</span>
    </button>
  );
});

export default Button;