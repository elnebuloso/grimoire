import type { DatabaseSync } from 'node:sqlite';
import { m } from '#lib/paraglide/messages.js';
import { checkRemote, type GitRemote } from '../sync/git';
import { decryptToken } from '../token-encryption';
import type { SourceForm } from './projects';

// The admin waits for this in the browser; a server that is up answers within a second or two.
const ACCESS_TIMEOUT_MS = 15 * 1000;

export type AccessResult = { ok: boolean; message: string };

interface StoredAccess {
	git_url: string;
	branch: string;
	username: string | null;
	encrypted_token: string | null;
}

function storedAccess(db: DatabaseSync, sourceId: number | undefined): StoredAccess | undefined {
	if (sourceId === undefined) return undefined;
	return db
		.prepare('SELECT git_url, branch, username, encrypted_token FROM sources WHERE id = ?')
		.get(sourceId) as StoredAccess | undefined;
}

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
		stored.git_url !== form.gitUrl.trim() ||
		stored.branch !== form.branch.trim() ||
		(stored.username ?? '') !== form.username.trim() ||
		form.token.trim() !== '' ||
		(form.removeToken && stored.encrypted_token !== null)
	);
}

/**
 * Asks the Git server whether the source in `form` can be read: the server answers, the
 * credentials are accepted and the branch exists. Uses the stored token of `sourceId` unless a new
 * one is entered or its removal is asked for.
 */
export async function checkSourceAccess(
	db: DatabaseSync,
	key: Buffer,
	sourceId: number | undefined,
	form: SourceForm
): Promise<AccessResult> {
	const stored = storedAccess(db, sourceId);
	const storedToken =
		stored?.encrypted_token && !form.removeToken
			? decryptToken(stored.encrypted_token, key)
			: undefined;
	const remote: GitRemote = {
		url: form.gitUrl.trim(),
		username: form.username.trim() || null,
		token: form.token.trim() || storedToken
	};
	const branch = form.branch.trim();
	const check = await checkRemote(remote, branch, ACCESS_TIMEOUT_MS);
	switch (check.status) {
		case 'ok':
			return { ok: true, message: m.access_ok({ branch, commit: check.commit.slice(0, 12) }) };
		case 'no-branch':
			return { ok: false, message: m.access_no_branch({ branch }) };
		case 'refused':
			return { ok: false, message: m.access_refused({ detail: check.detail }) };
		case 'unreachable':
			return { ok: false, message: m.access_unreachable({ detail: check.detail }) };
	}
}
