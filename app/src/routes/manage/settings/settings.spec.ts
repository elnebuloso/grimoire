import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { openDatabase } from '#lib/server/db/schema.js';
import * as settingsPage from './+page.server';

let db: DatabaseSync;

vi.mock('#lib/server/db/index.js', () => ({ database: () => db }));

function save(fields: Record<string, string>) {
	return settingsPage.actions.default({
		request: new Request('https://grimoire.example/manage/settings', {
			method: 'POST',
			body: new URLSearchParams(fields)
		})
	} as never);
}

beforeEach(() => {
	db = openDatabase(':memory:');
});

describe('settings page', () => {
	it('pauses all syncs with the checkbox and resumes them without it', async () => {
		expect(await save({ syncsPaused: 'on' })).toEqual({ saved: true });
		expect(settingsPage.load({} as never)).toEqual({ settings: { syncsPaused: true } });

		await save({});
		expect(settingsPage.load({} as never)).toEqual({ settings: { syncsPaused: false } });
	});
});
