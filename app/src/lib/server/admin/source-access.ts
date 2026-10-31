import type { DatabaseSync } from 'node:sqlite';
import { m } from '#lib/paraglide/messages.js';
import { checkRemote, type GitRemote } from '../sync/git';
import { decryptToken } from '../token-encryption';
import { remoteProblem, storedAccess, type SourceForm } from './sources';

// The admin waits for this in the browser; a server that is up answers within a second or two.
const ACCESS_TIMEOUT_MS = 15 * 1000;

/** What the Git server answered: a report when the source can be read, otherwise why not. */
export type AccessResult = { message: string } | { error: string };

/**
 * Whether saving `form` could change what grimoire can reach: a new source, or a changed Git URL,
 * branch, username or token. Anything else saves without asking the Git server.
 */
export function accessChanged(
	db: DatabaseSync,
	sourceId: number | undefined,
	form: SourceForm
): boolean {
	const stored = storedAccess(db, sourceId);
	if (!stored) return true;
	return (
		stored.gitUrl !== form.gitUrl.trim() ||
		stored.branch !== form.branch.trim() ||
		(stored.username ?? '') !== form.username.trim() ||
		form.token.trim() !== '' ||
		(form.removeToken && stored.encryptedToken !== null)
	);
}

/**
 * Asks the Git server whether the source in `form` can be read: the server answers, the
 * credentials are accepted and the branch exists. Uses the stored token of the source unless a
 * new one is entered or its removal is asked for. A URL that could not be saved is not contacted.
 * `sourceId` is undefined for a source not saved yet.
 */
export async function checkSourceAccess(
	db: DatabaseSync,
	key: Buffer,
	sourceId: number | undefined,
	form: SourceForm
): Promise<AccessResult> {
	const problem = remoteProblem(db, sourceId, form);
	if (problem) return { error: problem };
	const enteredToken = form.token.trim();
	const stored = storedAccess(db, sourceId);
	let storedToken: string | undefined;
	// Decrypted only when it is used: after a change of TOKEN_ENCRYPTION_KEY it cannot be, and
	// entering the token again is how the admin repairs the source.
	if (!enteredToken && !form.removeToken && stored?.encryptedToken) {
		try {
			storedToken = decryptToken(stored.encryptedToken, key);
		} catch {
			return { error: m.error_stored_token_unreadable() };
		}
	}
	const remote: GitRemote = {
		url: form.gitUrl.trim(),
		username: form.username.trim() || null,
		token: enteredToken || storedToken
	};
	const branch = form.branch.trim();
	const check = await checkRemote(remote, branch, ACCESS_TIMEOUT_MS);
	switch (check.status) {
		case 'ok':
			return { message: m.access_ok({ branch, commit: check.commit.slice(0, 12) }) };
		case 'no-branch':
			return { error: m.access_no_branch({ branch }) };
		case 'refused':
			return { error: m.access_refused({ detail: check.detail }) };
		case 'unreachable':
			return { error: m.access_unreachable({ detail: check.detail }) };
	}
}
