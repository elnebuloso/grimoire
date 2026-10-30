import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { isHttpError, isRedirect } from '@sveltejs/kit';
import { openDatabase } from '#lib/server/db/schema.js';
import { saveSettings } from '#lib/server/settings.js';
import * as sourcePage from './[id]/+page.server';
import type { AccessResult } from '#lib/server/admin/source-access.js';

let db: DatabaseSync;
// vi.mock is hoisted above the imports; the mock it returns has to be hoisted with it.
const syncPending = vi.hoisted(() => vi.fn(() => false));
const requestSyncInBackground = vi.hoisted(() => vi.fn());

vi.mock('#lib/server/db/index.js', () => ({ database: () => db }));
vi.mock('#lib/server/sync/index.js', () => ({ requestSyncInBackground, syncPending }));
// The Git server cannot be asked from a test; the check itself is tested against a local repository.
const checkSourceAccess = vi.hoisted(() =>
	vi.fn(async (): Promise<AccessResult> => ({
		message: 'Reachable: branch main is at commit abc.'
	}))
);
vi.mock('#lib/server/admin/source-access.js', async (original) => ({
	...(await original<object>()),
	checkSourceAccess
}));
vi.mock('$app/env/private', () => ({
	TOKEN_ENCRYPTION_KEY: Buffer.alloc(32, 7),
	SYNC_SCHEDULE: '*/5 * * * *',
	TZ: 'UTC'
}));

const TOKEN = 'glpat-very-secret';

function formRequest(fields: Record<string, string>) {
	return new Request('https://grimoire.example/manage/sources', {
		method: 'POST',
		body: new URLSearchParams(fields)
	});
}

/** Runs a handler that ends by throwing a redirect or an HTTP error, and returns what it threw. */
async function thrown(run: () => unknown): Promise<unknown> {
	try {
		await run();
	} catch (error) {
		return error;
	}
	throw new Error('expected the handler to throw');
}

async function saveSource(id: string, fields: Record<string, string>) {
	return sourcePage.actions.save({ request: formRequest(fields), params: { id } } as never);
}

function syncNow(id: string) {
	return sourcePage.actions.sync({
		params: { id },
		url: new URL(`https://grimoire.example/manage/sources/${id}?/sync`)
	} as never);
}

function loadSource(id: string, search = '') {
	return sourcePage.load({
		params: { id },
		url: new URL(`https://grimoire.example/manage/sources/${id}${search}`)
	} as never);
}

const SOURCE = {
	name: 'Auth Service',
	gitUrl: 'https://gitlab.example.com/platform/auth.git',
	branch: 'main',
	path: 'docs/',
	exclusions: '',
	schedule: '',
	username: 'deploy',
	token: TOKEN
};

beforeEach(() => {
	db = openDatabase(':memory:');
	requestSyncInBackground.mockClear();
	checkSourceAccess.mockClear();
});

describe('source page', () => {
	it('creates a source, requests a forced sync and redirects to its page', async () => {
		const result = await thrown(() => saveSource('new', SOURCE));

		expect(isRedirect(result) && [result.status, result.location]).toEqual([
			303,
			'/manage/sources/1'
		]);
		expect(requestSyncInBackground).toHaveBeenCalledExactlyOnceWith(1, { force: true });
	});

	it('never puts the token into page data', async () => {
		await thrown(() => saveSource('new', SOURCE));

		const data = [loadSource('1'), await saveSource('new', SOURCE)];

		expect(data[0]).toMatchObject({ source: { username: 'deploy', hasToken: true } });
		expect(data[1]).toMatchObject({ status: 400 });
		const stored = db.prepare('SELECT encrypted_token FROM sources').get() as {
			encrypted_token: string;
		};
		for (const page of data) {
			expect(JSON.stringify(page)).not.toContain(TOKEN);
			expect(JSON.stringify(page)).not.toContain(stored.encrypted_token);
		}
	});

	it('sends a rejected Git URL back without its credentials', async () => {
		const result = await saveSource('new', {
			...SOURCE,
			gitUrl: 'https://user:hunter2@gitlab.example.com/a.git'
		});

		expect(result).toMatchObject({
			status: 400,
			data: { values: { gitUrl: 'https://gitlab.example.com/a.git' } }
		});
	});

	it('answers an unknown or malformed id with 404', async () => {
		await thrown(() => saveSource('new', SOURCE));

		for (const id of ['2', 'abc', '0']) {
			const result = await thrown(() => loadSource(id));

			expect(isHttpError(result) && result.status).toBe(404);
		}
	});

	it('saves the description trimmed', async () => {
		await thrown(() => saveSource('new', { ...SOURCE, description: ' Login and sessions ' }));

		expect(loadSource('1')).toMatchObject({ source: { description: 'Login and sessions' } });
	});

	it('refuses a second source whose name gives a slug another source has', async () => {
		await thrown(() => saveSource('new', SOURCE));

		expect(await saveSource('new', { ...SOURCE, name: 'auth service' })).toMatchObject({
			status: 400,
			data: { error: 'A source with the slug "auth-service" already exists.' }
		});
	});

	it('creates a paused source without syncing it, and syncs it now while it stays paused', async () => {
		await thrown(() => saveSource('new', { ...SOURCE, paused: 'on' }));
		expect(requestSyncInBackground).not.toHaveBeenCalled();
		expect(loadSource('1')).toMatchObject({ source: { paused: true }, nextCheck: undefined });

		await thrown(() => syncNow('1'));

		expect(requestSyncInBackground).toHaveBeenCalledExactlyOnceWith(1, { force: true });
		expect(loadSource('1')).toMatchObject({ source: { paused: true } });
	});

	it('saves a source without syncing it while all syncs are paused, and syncs it now', async () => {
		saveSettings(db, { syncsPaused: true });

		await thrown(() => saveSource('new', SOURCE));
		expect(requestSyncInBackground).not.toHaveBeenCalled();
		expect(loadSource('1')).toMatchObject({
			source: { paused: false },
			syncsPaused: true,
			nextCheck: undefined
		});

		await thrown(() => syncNow('1'));
		expect(requestSyncInBackground).toHaveBeenCalledExactlyOnceWith(1, { force: true });
	});

	it('resumes a paused source when saved without the checkbox and checks it for a new commit', async () => {
		await thrown(() => saveSource('new', { ...SOURCE, paused: 'on' }));

		await thrown(() => saveSource('1', SOURCE));

		expect(loadSource('1')).toMatchObject({ source: { paused: false } });
		expect(requestSyncInBackground).toHaveBeenCalledExactlyOnceWith(1, { force: false });
	});

	it('forces a sync on save only when the index changes or the last sync failed', async () => {
		await thrown(() => saveSource('new', SOURCE));
		let fields: Record<string, string> = { ...SOURCE, token: '' };
		const forcedAfter = async (change: Record<string, string>) => {
			fields = { ...fields, ...change };
			requestSyncInBackground.mockClear();
			await thrown(() => saveSource('1', fields));
			return requestSyncInBackground.mock.calls[0][1].force;
		};

		expect(await forcedAfter({ name: 'Login', description: 'Sign-in', public: 'on' })).toBe(false);
		expect(await forcedAfter({ gitUrl: 'https://gitlab.example.com/platform/login.git' })).toBe(
			true
		);
		expect(await forcedAfter({ branch: 'develop' })).toBe(true);
		expect(await forcedAfter({ path: 'site/' })).toBe(true);
		expect(await forcedAfter({ exclusions: 'drafts/**' })).toBe(true);
		expect(await forcedAfter({ schedule: '0 2 * * *' })).toBe(false);

		db.prepare('UPDATE sources SET error = \'branch "develop" not found\' WHERE id = 1').run();
		expect(await forcedAfter({})).toBe(true);
	});

	it('changes the slug of a source, even a paused one, without syncing it again', async () => {
		await thrown(() => saveSource('new', { ...SOURCE, paused: 'on' }));
		requestSyncInBackground.mockClear();
		const result = await sourcePage.actions.slug({
			request: formRequest({ slug: 'login', confirmation: 'auth-service' }),
			params: { id: '1' }
		} as never);

		expect(result).toEqual({ slugChanged: true });
		expect(loadSource('1')).toMatchObject({ source: { slug: 'login', paused: true } });
		expect(requestSyncInBackground).not.toHaveBeenCalled();
	});

	it('saves the documentation URL and keeps the entered values when it is invalid', async () => {
		await thrown(() => saveSource('new', { ...SOURCE, docsUrl: 'https://docs.example.com/auth/' }));
		expect(loadSource('1')).toMatchObject({
			source: { docsUrl: 'https://docs.example.com/auth/' }
		});

		const result = await saveSource('1', { ...SOURCE, docsUrl: 'javascript:alert(1)' });

		expect(result).toMatchObject({
			status: 400,
			data: {
				error: expect.stringContaining('web address'),
				values: { docsUrl: 'javascript:alert(1)' }
			}
		});
		expect(loadSource('1')).toMatchObject({
			source: { docsUrl: 'https://docs.example.com/auth/' }
		});
	});

	it('saves nothing when the repository cannot be reached, and shows why', async () => {
		checkSourceAccess.mockResolvedValueOnce({ error: 'Access refused.' });

		const result = await saveSource('new', SOURCE);

		expect(result).toMatchObject({ status: 400, data: { error: 'Access refused.' } });
		expect(db.prepare('SELECT count(*) AS n FROM sources').get()).toEqual({ n: 0 });
		expect(requestSyncInBackground).not.toHaveBeenCalled();
	});

	it('asks the Git server again only when the URL, branch, username or token change', async () => {
		await thrown(() => saveSource('new', SOURCE));
		checkSourceAccess.mockClear();

		await thrown(() =>
			saveSource('1', {
				...SOURCE,
				token: '',
				name: 'Login',
				path: 'site/',
				schedule: '0 2 * * *'
			})
		);
		expect(checkSourceAccess).not.toHaveBeenCalled();

		await thrown(() => saveSource('1', { ...SOURCE, token: '', branch: 'develop' }));
		expect(checkSourceAccess).toHaveBeenCalledOnce();
	});

	it('tests the connection and keeps an entered token, only encrypted', async () => {
		const result = (await sourcePage.actions.test({
			request: formRequest(SOURCE),
			params: { id: 'new' }
		} as never)) as { access: unknown; values: { encryptedToken: string } };

		expect(result.access).toEqual({ message: 'Reachable: branch main is at commit abc.' });
		expect(checkSourceAccess).toHaveBeenCalledWith(
			db,
			expect.any(Buffer),
			undefined,
			expect.objectContaining({ token: TOKEN })
		);
		expect(JSON.stringify(result)).not.toContain(TOKEN);
		expect(result.values.encryptedToken).not.toBe('');

		await thrown(() =>
			saveSource('new', { ...SOURCE, token: '', encryptedToken: result.values.encryptedToken })
		);
		const stored = db.prepare('SELECT encrypted_token FROM sources').get() as {
			encrypted_token: string;
		};
		expect(stored.encrypted_token).not.toBeNull();
	});

	async function carriedToken(sourceId: string, token: string) {
		const result = (await sourcePage.actions.test({
			request: formRequest({ ...SOURCE, token }),
			params: { id: sourceId }
		} as never)) as { values: { encryptedToken: string } };
		return result.values.encryptedToken;
	}

	function storedToken() {
		return (db.prepare('SELECT encrypted_token FROM sources').get() as { encrypted_token: string })
			.encrypted_token;
	}

	it('discards an entered token on a new source', async () => {
		const encryptedToken = await carriedToken('new', TOKEN);

		await thrown(() =>
			saveSource('new', { ...SOURCE, token: '', encryptedToken, discardToken: 'on' })
		);

		expect(storedToken()).toBeNull();
	});

	it('discards an entered token without removing the stored one', async () => {
		await thrown(() => saveSource('new', SOURCE));
		const stored = storedToken();
		const encryptedToken = await carriedToken('1', 'glpat-typo');

		await thrown(() =>
			saveSource('1', { ...SOURCE, token: '', encryptedToken, discardToken: 'on' })
		);

		expect(storedToken()).toBe(stored);
	});

	it('answers a changed carried token with 400 instead of failing', async () => {
		const fields = { ...SOURCE, token: '', encryptedToken: 'tampered' };
		const tested = await sourcePage.actions.test({
			request: formRequest(fields),
			params: { id: 'new' }
		} as never);
		const saved = await saveSource('new', fields);

		for (const result of [tested, saved]) {
			expect(result).toMatchObject({
				status: 400,
				data: { error: 'The entered access token could not be read back. Enter it again.' }
			});
		}
		expect(checkSourceAccess).not.toHaveBeenCalled();
		expect(db.prepare('SELECT COUNT(*) AS n FROM sources').get()).toEqual({ n: 0 });
	});

	it('queues a forced sync now without waiting for it, and shows it pending', async () => {
		await thrown(() => saveSource('new', SOURCE));
		requestSyncInBackground.mockClear();

		const result = await thrown(() => syncNow('1'));
		syncPending.mockReturnValueOnce(true);

		expect(requestSyncInBackground).toHaveBeenCalledExactlyOnceWith(1, { force: true });
		expect(isRedirect(result) && result.location).toBe('/manage/sources/1');
		expect(loadSource('1')).toMatchObject({ syncPending: true });
		expect(syncPending).toHaveBeenCalledWith(1);
	});

	it('shows the status and the preview of a page the query names', async () => {
		await thrown(() => saveSource('new', SOURCE));
		const page = db
			.prepare(
				`INSERT INTO pages (source_id, file, title, content) VALUES (1, 'deploy.md', 'Deploy', '')`
			)
			.run().lastInsertRowid;
		db.prepare(
			`INSERT INTO snippets (page_id, position, title_path, content, tokens)
			VALUES (?, 0, '["Deploy"]', 'Run make deploy.', 4)`
		).run(page);

		const data = loadSource('1', '?preview=deploy.md');

		expect(data).toMatchObject({
			status: { totals: { pages: 1, snippets: 1, tokens: 4 } },
			preview: {
				file: 'deploy.md',
				snippets: [{ tokens: 4, markdown: expect.stringContaining('Run make deploy.') }]
			}
		});
		expect(loadSource('1')).toMatchObject({ preview: undefined });
	});

	it('deletes the source and redirects to the overview', async () => {
		await thrown(() => saveSource('new', SOURCE));
		const result = await thrown(() => sourcePage.actions.delete({ params: { id: '1' } } as never));

		expect(isRedirect(result) && result.location).toBe('/manage');
		expect(db.prepare('SELECT count(*) AS n FROM sources').get()).toEqual({ n: 0 });
	});
});
