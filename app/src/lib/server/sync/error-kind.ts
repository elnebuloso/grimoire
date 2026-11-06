import { REFUSED } from './git';
import { UNRESOLVABLE, type SyncErrorKind } from './failure';

export type { SyncErrorKind } from './failure';

// Errors stored before the kind was recorded with them carry only their message; these patterns
// match the messages of that time. New errors bring their kind along and never get here.
const KINDS: [SyncErrorKind, RegExp][] = [
	['path', /^source path ".*" does not exist in the repository/],
	['branch', /^branch ".*" not found in /],
	['deadline', /^indexing took longer than /],
	['aborted', /^indexing ended with /],
	['noPage', /^no page could be indexed/],
	['redirect', /redirects this URL elsewhere \(HTTP \d{3}\)/],
	['forbidden', /^The server may not connect to /]
];

// The credential texts of `git.ts` that replace git's own output when it asked for a login.
const CREDENTIALS = /the Git server (refused the username and token|asks for a username and token)/;

/** The kind of a stored error without a recorded kind, read from its message. */
export function syncErrorKind(message: string): SyncErrorKind {
	for (const [kind, pattern] of KINDS) if (pattern.test(message)) return kind;
	if (UNRESOLVABLE.test(message)) return 'noAddress';
	if (CREDENTIALS.test(message) || REFUSED.test(message)) return 'access';
	if (/^git \S+ failed: /.test(message)) return 'unreachable';
	return 'unknown';
}

/** The kind recorded with an error, or for an older one its kind read from the message. */
export function errorKind(error: string | null, recorded: SyncErrorKind | null) {
	if (error === null) return null;
	return recorded ?? syncErrorKind(error);
}
