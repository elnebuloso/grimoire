import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '#lib/server/db/schema.js';
import * as page from './+page.server';

let db: DatabaseSync;

const ADMIN = { id: 1, email: 'admin@example.com', roles: ['admin'] };

vi.mock('#lib/server/db/index.js', () => ({ database: () => db }));

function addDeadLink(sourceId: number, file: string, target: string) {
	const pageId = db
		.prepare(`INSERT INTO pages (source_id, file, title, content) VALUES (?, ?, 'T', '')`)
		.run(sourceId, file).lastInsertRowid;
	db.prepare('INSERT INTO links (page_id, anchor, target, dead) VALUES (?, NULL, ?, 1)').run(
		pageId,
		target
	);
}

beforeEach(() => {
	db = openDatabase(':memory:');
	db.exec(`
		INSERT INTO sources (id, slug, name, git_url, branch, path)
		VALUES (1, 'platform-auth', 'Platform auth', 'https://git.example.com/a.git', 'main', ''),
			(2, 'billing-docs', 'Billing docs', 'https://git.example.com/d.git', 'main', '');
	`);
});

describe('dead links page', () => {
	it('has nothing to list without dead links', () => {
		expect(page.load({ locals: { user: ADMIN } } as never)).toEqual({ groups: [] });
	});

	it('groups the dead links by source', () => {
		addDeadLink(1, 'a.md', 'platform-auth/x');
		addDeadLink(1, 'b.md', 'platform-auth/y');
		addDeadLink(2, 'index.md', 'billing-docs/z');

		const { groups } = page.load({ locals: { user: ADMIN } } as never) as {
			groups: { source: string; sourceId: number; links: { target: string }[] }[];
		};
		expect(groups.map((group) => [group.source, group.links.map((link) => link.target)])).toEqual([
			['billing-docs', ['billing-docs/z']],
			['platform-auth', ['platform-auth/x', 'platform-auth/y']]
		]);
		expect(Object.keys(groups[0]).sort()).toEqual(['links', 'source', 'sourceId']);
	});

	it('lists a user only the dead links of their own sources', () => {
		db.exec(`INSERT INTO users (id, email, password_hash) VALUES (9, 'writer@example.com', 'hash');
			UPDATE sources SET owner_id = 9, visibility = 'internal' WHERE id = 2;
			UPDATE sources SET visibility = 'internal' WHERE id = 1;`);
		addDeadLink(1, 'a.md', 'platform-auth/x');
		addDeadLink(2, 'index.md', 'billing-docs/z');

		const writer = { id: 9, email: 'writer@example.com', roles: [] };
		const { groups } = page.load({ locals: { user: writer } } as never) as {
			groups: { source: string }[];
		};
		expect(groups.map((group) => group.source)).toEqual(['billing-docs']);
	});
});
