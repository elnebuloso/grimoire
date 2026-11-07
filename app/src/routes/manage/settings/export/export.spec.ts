import { describe, it, expect, beforeEach, vi } from 'vitest';
import { randomBytes } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { isRedirect } from '@sveltejs/kit';
import { openDatabase } from '#lib/server/db/schema.js';
import { readExport } from '#lib/server/instance-export.js';
import { deriveKeys, encryptSecret } from '#lib/server/secret-encryption.js';

const keys = deriveKeys(randomBytes(32));
let db: DatabaseSync;

vi.mock('#lib/server/db/index.js', () => ({ database: () => db }));
vi.mock('$app/env/private', () => ({
	ENCRYPTION_KEY: keys,
	INSTANCE_TITLE: 'Acme Docs – Intern',
	TZ: 'Europe/Berlin',
	LOG_FORMAT: 'ecs',
	LOG_LEVEL: 'info'
}));

const { POST } = await import('./+server');
const { login } = await import('#lib/server/auth/auth.js');
const { createUser } = await import('#lib/server/auth/test-user.js');

const PASSPHRASE = 'harbour lantern seventeen';
const PASSWORD = 'correct horse battery';
let session: string;

function exportWith(fields: Record<string, string>, current = PASSWORD) {
	return POST({
		request: new Request('https://grimoire.example/manage/settings/export', {
			method: 'POST',
			body: new URLSearchParams({ current, ...fields })
		}),
		locals: { user: { id: 1 } },
		cookies: { get: (name: string) => (name === 'grimoire_session' ? session : undefined) },
		getClientAddress: () => '203.0.113.7'
	} as never);
}

async function refusal(fields: Record<string, string>, current?: string): Promise<string> {
	try {
		await exportWith(fields, current);
	} catch (error) {
		if (isRedirect(error)) return error.location;
		throw error;
	}
	throw new Error('expected a redirect');
}

beforeEach(async () => {
	db = openDatabase(':memory:');
	await createUser(db, { email: 'admin@example.com', password: PASSWORD, roles: ['admin'] });
	const loggedIn = await login(db, 'admin-pc', { email: 'admin@example.com', password: PASSWORD });
	if (!('session' in loggedIn)) throw new Error(loggedIn.error);
	session = loggedIn.session;
	db.exec(`INSERT INTO sources (id, slug, name, git_url, branch, path)
		VALUES (1, 'billing-docs', 'Billing', 'https://git.example.com/billing.git', 'main', 'docs')`);
	db.prepare('UPDATE sources SET encrypted_token = ?').run(
		encryptSecret('glpat-billing-token', keys.sourceTokens)
	);
});

describe('export download', () => {
	it('downloads an export the passphrase reads, named after the instance and the day', async () => {
		vi.useFakeTimers({ now: new Date('2026-11-04T23:30:00Z'), toFake: ['Date'] });
		const response = await exportWith({ passphrase: PASSPHRASE, repeat: PASSPHRASE });
		vi.useRealTimers();

		expect(response.headers.get('content-disposition')).toBe(
			'attachment; filename="acme-docs-intern-2026-11-05.grimoire-export"'
		);
		expect(response.headers.get('cache-control')).toBe('no-store');
		const result = await readExport(Buffer.from(await response.arrayBuffer()), PASSPHRASE);
		if (!('db' in result)) throw new Error(result.error);
		expect(result.db.prepare('SELECT slug, encrypted_token FROM sources').all()).toEqual([
			{ slug: 'billing-docs', encrypted_token: 'glpat-billing-token' }
		]);
	});

	it('refuses a short passphrase and two that differ', async () => {
		expect(await refusal({ passphrase: 'too short', repeat: 'too short' })).toBe(
			'/manage/settings?export=passphrase-too-short#export'
		);
		expect(await refusal({ passphrase: PASSPHRASE, repeat: `${PASSPHRASE}.` })).toBe(
			'/manage/settings?export=passphrase-mismatch#export'
		);
		expect(await refusal({})).toBe('/manage/settings?export=passphrase-too-short#export');
	});

	it('refuses without the current password of the admin, and writes no file', async () => {
		expect(await refusal({ passphrase: PASSPHRASE, repeat: PASSPHRASE }, 'wrong password')).toBe(
			'/manage/settings?export=wrong-current-password#export'
		);
		expect(await refusal({ passphrase: PASSPHRASE, repeat: PASSPHRASE }, '')).toBe(
			'/manage/settings?export=wrong-current-password#export'
		);
	});

	it('refuses while a token does not decrypt, naming its source', async () => {
		db.prepare('UPDATE sources SET encrypted_token = ?').run(
			encryptSecret('glpat-billing-token', deriveKeys(randomBytes(32)).sourceTokens)
		);
		expect(await refusal({ passphrase: PASSPHRASE, repeat: PASSPHRASE })).toBe(
			'/manage/settings?export=unreadable-tokens&sources=billing-docs#export'
		);
	});
});
