import * as Dialog from '@radix-ui/react-dialog';
import Button from './Button';

// Confirmation dialog: Radix supplies focus trapping, Escape handling, and restoration.
export default function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel = 'Confirmer', onConfirm, loading = false, danger = false }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="ui-dialog-overlay" />
        <Dialog.Content className="ui-dialog-content" aria-describedby={description ? undefined : undefined}>
          <Dialog.Title className="ui-dialog-title">{title}</Dialog.Title>
          {description && <Dialog.Description className="ui-dialog-description">{description}</Dialog.Description>}
          <div className="ui-dialog-actions">
            <Button variant="secondary" type="button" onClick={() => onOpenChange(false)} disabled={loading}>Annuler</Button>
            <Button variant={danger ? 'danger' : 'primary'} type="button" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
          </div>
          <Dialog.Close asChild><button type="button" className="ui-dialog-close" aria-label="Fermer">×</button></Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}