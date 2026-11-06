import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { isRedirect } from '@sveltejs/kit';
import { openDatabase } from '#lib/server/db/schema.js';
import { deriveKeys } from '#lib/server/secret-encryption.js';
import { sealLink } from '#lib/server/oidc/flow.js';
import { LINK_COOKIE } from '#lib/server/oidc/cookie.js';
import type { OidcProvider } from '#lib/server/oidc/index.js';
import { createSession, SESSION_COOKIE, sessionUser } from '#lib/server/auth/auth.js';
import { sha256 } from '#lib/server/sha256.js';

const KEYS = deriveKeys(Buffer.alloc(32, 7));
const NOW = new Date();
const ISSUER = 'https://gitlab.example.com';
const PROVIDER: OidcProvider = {
	key: 'gitlab',
	issuer: ISSUER,
	clientId: 'grimoire',
	clientSecret: 'secret',
	label: 'GitLab',
	allowedDomains: ['example.com'],
	requiredClaims: [],
	redirectUri: 'https://grimoire.example/auth/oidc/gitlab/callback'
};

let db: DatabaseSync;

vi.mock('#lib/server/db/index.js', () => ({ database: () => db }));
vi.mock('$app/env/private', () => ({
	ENCRYPTION_KEY: KEYS,
	LOG_FORMAT: 'ecs',
	LOG_LEVEL: 'silent',
	TZ: 'UTC',
	OIDC_PROVIDERS: '',
	BASE_URL: ''
}));
vi.mock('#lib/server/oidc/index.js', () => ({
	providerByKey: (key: unknown) => (key === PROVIDER.key ? PROVIDER : undefined)
}));

function fakeCookies(initial: Record<string, string>) {
	const values = new Map(Object.entries(initial));
	return {
		get: (name: string) => values.get(name),
		set: (name: string, value: string) => values.set(name, value),
		delete: (name: string) => values.delete(name)
	};
}

/** Completes a link started by the session `startedBy`, in a request of the session `current`. */
async function completeLink(startedBy: string, current: string): Promise<string> {
	const { GET } = await import('./+server');
	const link = sealLink(
		{
			provider: 'gitlab',
			issuer: ISSUER,
			subject: 'gitlab-42',
			session: sha256(startedBy),
			expiresAt: new Date(NOW.getTime() + 60_000).toISOString()
		},
		KEYS.oidcFlows
	);
	try {
		GET({
			cookies: fakeCookies({ [LINK_COOKIE]: link, [SESSION_COOKIE]: current }),
			locals: { user: sessionUser(db, current) }
		} as never);
	} catch (thrown) {
		if (isRedirect(thrown)) return thrown.location;
		throw thrown;
	}
	throw new Error('no redirect');
}

function identities() {
	return db.prepare('SELECT user_id AS userId, subject FROM user_identities').all();
}

let alice: string;
let bob: string;

beforeEach(() => {
	db = openDatabase(':memory:');
	db.exec(`INSERT INTO users (id, email, password_hash) VALUES
		(1, 'alice@example.com', 'hash'), (2, 'bob@example.com', 'hash')`);
	alice = createSession(db, 1, NOW);
	bob = createSession(db, 2, NOW);
});

describe('completing a provider link', () => {
	it('links the identity to the account of the session that started it', async () => {
		expect(await completeLink(alice, alice)).toBe('/account?linked=gitlab');
		expect(identities()).toEqual([{ userId: 1, subject: 'gitlab-42' }]);
	});

	it('refuses when the session changed since the link started', async () => {
		expect(await completeLink(alice, bob)).toBe('/account?problem=oidc-failed');
		expect(identities()).toEqual([]);
	});
});
