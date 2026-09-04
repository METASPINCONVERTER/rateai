/**
 * Rate AI — Typed data errors
 *
 * Kept in its own module so the store can throw and inspect these without
 * importing the Firestore adapter — which matters because the adapter pulls the
 * Firebase SDK over the network, and offline/sample mode must not need it.
 */

/** @typedef {'offline'|'permission'|'unavailable'|'duplicate'|'unknown'} ErrorKind */

export class DataError extends Error {
  /** @param {ErrorKind} kind */
  constructor(kind, message, cause) {
    super(message);
    this.name = 'DataError';
    this.kind = kind;
    this.cause = cause;
  }
}

export function isOffline() {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

/** Turns whatever Firestore threw into something the interface can explain. */
export function classifyError(error) {
  if (error instanceof DataError) return error;
  if (isOffline()) return new DataError('offline', 'No network connection.', error);

  const code = String(error?.code ?? '');
  if (code.includes('permission-denied')) {
    return new DataError('permission', 'The database rejected this request.', error);
  }
  if (code.includes('unavailable') || code.includes('deadline-exceeded')) {
    return new DataError('unavailable', 'The database did not respond in time.', error);
  }
  return new DataError('unknown', error?.message || 'Something went wrong.', error);
}

export function assertOnline() {
  if (isOffline()) throw new DataError('offline', 'No network connection.');
}

/**
 * A sentence a reader can act on when a write fails. `subject` names what was
 * not saved, e.g. "your review". Read states use errorState() in components.js;
 * this is the one-line equivalent for a toast beside a form.
 */
export function failureMessage(error, subject = 'it') {
  const kind = error instanceof DataError ? error.kind : 'unknown';
  switch (kind) {
    case 'offline':
      return `You appear to be offline, so ${subject} was not saved. Reconnect and try again.`;
    case 'permission':
      return `The database refused the write, so ${subject} was not saved.`;
    case 'unavailable':
      return `The database did not respond, so ${subject} was not saved. Try again in a moment.`;
    case 'duplicate':
      return error.message;
    default:
      return error?.message || `Could not save ${subject}.`;
  }
}
