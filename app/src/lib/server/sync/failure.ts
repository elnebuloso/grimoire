/** What kind of failure a sync error is, so the admin area can name the fix. */
export type SyncErrorKind =
	| 'path'
	| 'branch'
	| 'access'
	| 'unreachable'
	| 'redirect'
	| 'forbidden'
	| 'noAddress'
	| 'deadline'
	| 'aborted'
	| 'noPage'
	| 'unknown';

/** A sync failure whose kind is known where it is thrown. */
export class SyncFailure extends Error {
	readonly kind: SyncErrorKind;

	constructor(kind: SyncErrorKind, message: string) {
		super(message);
		this.kind = kind;
	}
}

/** A host name that does not resolve: from the connection check, Node's lookup or Git itself. */
export const UNRESOLVABLE = /has no address|ENOTFOUND|EAI_AGAIN|Could not resolve host/;
