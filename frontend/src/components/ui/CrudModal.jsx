import * as Dialog from '@radix-ui/react-dialog';

// CRUD modal: shared structure for forms; callers own validation and API behavior.
export default function CrudModal({ open, onOpenChange, title, children, footer }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="ui-dialog-overlay" />
        <Dialog.Content className="ui-dialog-content ui-crud-modal">
          <Dialog.Title className="ui-dialog-title">{title}</Dialog.Title>
          <Dialog.Close asChild><button type="button" className="ui-dialog-close" aria-label="Fermer">×</button></Dialog.Close>
          <div className="ui-crud-modal-body">{children}</div>
          {footer && <div className="ui-dialog-actions">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}