import * as Toast from '@radix-ui/react-toast';
import { createContext, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

// Toast provider: success and error messages survive modal navigation.
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const value = useMemo(() => ({
    showToast(message, type = 'success') {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((current) => [...current, { id, message, type }]);
    },
  }), []);
  return <ToastContext.Provider value={value}><Toast.Provider swipeDirection="right">{children}{toasts.map((toast) => <Toast.Root key={toast.id} className={`ui-toast ui-toast-${toast.type}`} open onOpenChange={(open) => { if (!open) setToasts((current) => current.filter((item) => item.id !== toast.id)); }}><Toast.Description>{toast.message}</Toast.Description><Toast.Close className="ui-toast-close" aria-label="Fermer">×</Toast.Close></Toast.Root>)}<Toast.Viewport className="ui-toast-viewport" /></Toast.Provider></ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast doit être utilisé dans ToastProvider.');
  return context;
}