import { REFUSED } from './git';

/** What kind of failure a stored sync error is, so the admin area can name the fix. */
export type SyncErrorKind =
	'path' | 'branch' | 'access' | 'unreachable' | 'deadline' | 'aborted' | 'noPage' | 'unknown';

// Matches the messages thrown in this directory; a message no pattern knows is `unknown`.
const KINDS: [SyncErrorKind, RegExp][] = [
	['path', /^source path ".*" does not exist in the repository/],
	['branch', /^branch ".*" not found in /],
	['deadline', /^indexing took longer than /],
	['aborted', /^indexing ended with /],
	['noPage', /^no page could be indexed/]
];

// The credential texts of `git.ts` that replace git's own output when it asked for a login.
const CREDENTIALS = /the Git server (refused the username and token|asks for a username and token)/;

export function syncErrorKind(message: string): SyncErrorKind {
	for (const [kind, pattern] of KINDS) if (pattern.test(message)) return kind;
	if (CREDENTIALS.test(message) || REFUSED.test(message)) return 'access';
	if (/^git \S+ failed: /.test(message)) return 'unreachable';
	return 'unknown';
}
