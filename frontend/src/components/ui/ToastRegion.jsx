import * as Toast from '@radix-ui/react-toast';
import { createContext, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

// Toast provider: success and error messages survive modal navigation.
// showToast(message, type, action?) — action = { label, onClick } for a retry.
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const retirer = (id) => setToasts((current) => current.filter((item) => item.id !== id));
  const value = useMemo(() => ({
    showToast(message, type = 'success', action = null) {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((current) => [...current, { id, message, type, action }]);
    },
  }), []);
  return <ToastContext.Provider value={value}><Toast.Provider swipeDirection="right">{children}{toasts.map((toast) => <Toast.Root key={toast.id} className={`ui-toast ui-toast-${toast.type}`} open onOpenChange={(open) => { if (!open) retirer(toast.id); }}><Toast.Description>{toast.message}</Toast.Description>{toast.action && <button type="button" className="ui-toast-action" onClick={() => { retirer(toast.id); toast.action.onClick?.(); }}>{toast.action.label}</button>}<Toast.Close className="ui-toast-close" aria-label="Fermer">×</Toast.Close></Toast.Root>)}<Toast.Viewport className="ui-toast-viewport" /></Toast.Provider></ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast doit être utilisé dans ToastProvider.');
  return context;
}