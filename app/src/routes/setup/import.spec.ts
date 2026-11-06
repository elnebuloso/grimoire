import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { DatabaseSync } from 'node:sqlite';
import { isRedirect } from '@sveltejs/kit';
import { openDatabase } from '#lib/server/db/schema.js';
import { deriveKeys } from '#lib/server/secret-encryption.js';

// The fixture was written with the production cost of scrypt, which the test setup lowers. Each
// read of it takes half a second alone and several on a busy machine, past the default timeout.
vi.unmock('node:crypto');
vi.setConfig({ testTimeout: 30_000 });

const keys = deriveKeys(randomBytes(32));
let db: DatabaseSync;

vi.mock('#lib/server/db/index.js', () => ({ database: () => db }));
vi.mock('$app/env/private', () => ({
	ENCRYPTION_KEY: keys,
	LOG_FORMAT: 'ecs',
	LOG_LEVEL: 'info',
	GIT_ALLOWED_HOSTS: []
}));

const FIXTURE = readFileSync(
	new URL('../../lib/server/fixtures/export-schema-4.grimoire-export', import.meta.url)
);
const PASSPHRASE = 'fixture passphrase 2026';

let importAction: (event: never) => Promise<unknown>;
let token: string;

// The first import transforms the page and everything it imports, which on a busy machine
// outlasted the 10 s of a hook; imports after `vi.resetModules` reuse the transforms.
beforeAll(() => import('./+page.server'), 60_000);

// The setup token is module state of the auth module, written to the log once: fresh modules per
// test, and the token read from what they log.
beforeEach(async () => {
	db = openDatabase(':memory:');
	vi.resetModules();
	const logged = (await import('#lib/server/capture-log.js')).captureLog().messages;
	const auth = await import('#lib/server/admin/auth.js');
	importAction = (await import('./+page.server')).actions.import as never;
	auth.checkAdminAccount(db);
	token = logged()
		.findLast((message) => message.includes('setup token'))!
		.split(' ')
		.at(-1)!;
});

function submit(fields: { token?: string; passphrase?: string; file?: Buffer }) {
	const body = new FormData();
	body.set('token', fields.token ?? token);
	body.set('passphrase', fields.passphrase ?? PASSPHRASE);
	if (fields.file)
		body.set('file', new File([new Uint8Array(fields.file)], 'export.grimoire-export'));
	return importAction({
		request: new Request('https://grimoire.example/setup?/import', { method: 'POST', body })
	} as never);
}

async function redirectOf(run: Promise<unknown>): Promise<string> {
	try {
		await run;
	} catch (error) {
		if (isRedirect(error)) return error.location;
		throw error;
	}
	throw new Error('expected a redirect');
}

function users(): unknown[] {
	return db.prepare('SELECT email FROM users ORDER BY id').all();
}

describe('import on the setup page', () => {
	it('imports the export and leads to the login', async () => {
		expect(await redirectOf(submit({ file: FIXTURE }))).toBe('/login?imported');
		expect(users()).toEqual([{ email: 'ada@example.com' }, { email: 'bob@example.com' }]);
	});

	it('needs the setup token, before the file is read', async () => {
		expect(await submit({ token: 'not-the-token', file: FIXTURE })).toMatchObject({
			status: 400,
			data: { error: 'Wrong setup token. It is in the server log.', field: 'token' }
		});
		expect(users()).toEqual([]);
	});

	it('marks the field a refusal of the file concerns, and writes nothing', async () => {
		expect(await submit({})).toMatchObject({
			data: { error: 'Choose the export file to import.', field: 'file' }
		});
		expect(await submit({ file: Buffer.from('not an export') })).toMatchObject({
			data: { error: 'The file is not a grimoire export.', field: 'file' }
		});
		expect(await submit({ file: FIXTURE, passphrase: 'harbour lantern eighteen' })).toMatchObject({
			data: {
				error:
					'The passphrase is wrong, or the file was changed or cut short since it was exported.',
				field: 'passphrase'
			}
		});
		expect(users()).toEqual([]);
	});

	it('refuses an instance with a source, which an admin reset leaves behind', async () => {
		db.exec(`INSERT INTO sources (slug, name, git_url, branch, path)
			VALUES ('docs', 'Docs', 'https://git.example.com/docs.git', 'main', 'docs')`);
		expect(await submit({ file: FIXTURE })).toMatchObject({
			data: {
				error:
					'This instance has users or sources already; an export is imported only into an empty one.'
			}
		});
		expect(users()).toEqual([]);
	});
});
