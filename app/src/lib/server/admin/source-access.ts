import type { DatabaseSync } from 'node:sqlite';
import type { Refusal } from '#lib/forms.js';
import { m } from '#lib/paraglide/messages.js';
import type { ConnectionPolicy } from '../sync/connection-policy';
import { checkRemote, redirectTarget, remotePathExists, type GitRemote } from '../sync/git';
import { decryptSecret } from '../secret-encryption';
import { remoteProblem, storedSource, type SourceForm, type StoredSource } from './sources';

// The admin waits for this in the browser; a server that is up answers within a second or two.
const ACCESS_TIMEOUT_MS = 15 * 1000;
// The path needs the tree of the branch, which takes longer for a large repository.
const PATH_TIMEOUT_MS = 60 * 1000;

/**
 * What the Git server answered: a report when the source can be read, otherwise why not, with
 * `field` naming the form field the refusal is about.
 */
export type AccessResult = { message: string } | Refusal;

/**
 * Asks the Git server whether the source in `form` can be read; a URL that could not be saved is
 * not contacted. `sourceId` is undefined for a source not saved yet.
 */
export async function checkSourceAccess(
	db: DatabaseSync,
	key: Buffer,
	sourceId: number | undefined,
	form: SourceForm,
	policy: ConnectionPolicy
): Promise<AccessResult> {
	const stored = storedSource(db, sourceId);
	const problem = remoteProblem(stored, form);
	if (problem) return problem;
	return checkAccess(key, stored, form, policy);
}

/**
 * Asks the Git server whether the source in `form` can be read: the server answers, the
 * credentials are accepted, the branch exists and has the path, if the server may connect to it
 * at all. Uses the token of `stored`, the source as
 * `storedSource` read it, unless a new one is entered or its removal is asked for. Contacts the
 * URL without checking it: `remoteProblem` must have passed it.
 */
export async function checkAccess(
	key: Buffer,
	stored: StoredSource | undefined,
	form: SourceForm,
	policy: ConnectionPolicy
): Promise<AccessResult> {
	const enteredToken = form.token.trim();
	let storedToken: string | undefined;
	// Decrypted only when it is used: after a change of ENCRYPTION_KEY it cannot be, and
	// entering the token again is how the admin repairs the source.
	if (!enteredToken && !form.removeToken && stored?.encryptedToken) {
		try {
			storedToken = decryptSecret(stored.encryptedToken, key);
		} catch {
			return { error: m.error_stored_token_unreadable(), field: 'token' };
		}
	}
	const remote: GitRemote = {
		url: form.gitUrl.trim(),
		username: form.username.trim() || null,
		token: enteredToken || storedToken,
		policy
	};
	const branch = form.branch.trim();
	const check = await checkRemote(remote, branch, ACCESS_TIMEOUT_MS);
	switch (check.status) {
		case 'ok': {
			const path = form.path.trim();
			let exists: boolean;
			try {
				exists = await remotePathExists(remote, branch, path, PATH_TIMEOUT_MS);
			} catch (error) {
				return { error: m.access_unreachable({ detail: (error as Error).message }) };
			}
			if (!exists) return { error: m.access_path_missing({ path, branch }), field: 'path' };
			return { message: m.access_ok({ branch, commit: check.commit.slice(0, 12) }) };
		}
		case 'no-branch':
			return { error: m.access_no_branch({ branch }), field: 'branch' };
		case 'refused':
			return { error: m.access_refused({ detail: check.detail }) };
		case 'unreachable':
			return { error: m.access_unreachable({ detail: check.detail }) };
		case 'forbidden':
			return { error: m.error_git_host_refused({ host: check.host }) };
		case 'redirected': {
			// Only named, never followed: whoever edits the source enters the URL themselves.
			const target = await redirectTarget(remote).catch(() => undefined);
			return {
				error: target
					? m.access_redirected_to({ url: target })
					: m.access_redirected({ status: String(check.httpStatus) })
			};
		}
	}
}
