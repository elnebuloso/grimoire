import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '#lib/server/db/schema.js';

let db: DatabaseSync;

vi.mock('#lib/server/db/index.js', () => ({ database: () => db }));
vi.mock('#lib/server/mail/index.js', () => ({ mailer: () => undefined }));
vi.mock('$app/env/private', () => ({ BASE_URL: '', OIDC_PROVIDERS: '' }));

let load: (event: never) => { imported: boolean; refused: string[] };

// The first import transforms the page and what it imports, which on a busy machine took seconds.
beforeAll(async () => {
	load = (await import('./+page.server')).load as never;
}, 60_000);

beforeEach(() => {
	db = openDatabase(':memory:');
	db.exec(`INSERT INTO sources (slug, name, git_url, branch, path)
		VALUES ('billing-docs', 'Billing docs', 'https://git.internal.example/billing.git', 'main', 'docs')`);
});

function loadAt(search: string) {
	return load({ url: new URL(`https://grimoire.example/login${search}`) } as never);
}

describe('login after an import', () => {
	it('names the sources the import found unable to sync', () => {
		expect(loadAt('?imported&refused=billing-docs')).toMatchObject({
			imported: true,
			refused: ['billing-docs']
		});
	});

	it('names no source that does not exist, so a link cannot put text on the page', () => {
		expect(loadAt('?imported&refused=Call%20+1%20555%200100&refused=billing-docs').refused).toEqual(
			['billing-docs']
		);
	});

	it('names nothing after an import without such sources', () => {
		expect(loadAt('?imported')).toMatchObject({ imported: true, refused: [] });
	});
});
