import Chargement from '../Chargement';
import MessageErreur from '../MessageErreur';
import EmptyState from './EmptyState';

// Async state: one predictable loading, error/retry, and empty contract.
export default function AsyncState({ loading, error, onRetry, empty, emptyTitle, emptyDescription, emptyAction, children }) {
  if (loading) return <Chargement />;
  if (error) return <MessageErreur message={error} onRetry={onRetry} />;
  if (empty) return <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  return children;
}