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
		expect(
			settingsPage.load({ url: new URL('https://grimoire.example/manage/settings') } as never)
		).toMatchObject({ settings: { syncsPaused: true } });

		await save({});
		expect(
			settingsPage.load({ url: new URL('https://grimoire.example/manage/settings') } as never)
		).toMatchObject({ settings: { syncsPaused: false } });
	});
});

describe('export refusals on the settings page', () => {
	function problemOf(query: string) {
		const url = new URL(`https://grimoire.example/manage/settings?${query}`);
		return (settingsPage.load({ url } as never) as { exportProblem: unknown }).exportProblem;
	}

	it('shows a refused passphrase at its field', () => {
		expect(problemOf('export=passphrase-too-short')).toEqual({
			message: 'The passphrase needs at least 12 characters.',
			aboutPassphrase: true
		});
		expect(problemOf('export=passphrase-mismatch')).toEqual({
			message: 'The two passphrases differ.',
			aboutPassphrase: true
		});
	});

	it('names the sources whose token is unreadable, and nothing that is no slug', () => {
		expect(
			problemOf('export=unreadable-tokens&sources=billing-docs,Not%20a%20slug,platform')
		).toEqual({
			message:
				'The access token of billing-docs, platform cannot be read with the encryption key of this instance. Enter it again or remove it on the page of the source, then export again.',
			aboutPassphrase: false
		});
	});

	it('shows nothing without a known refusal', () => {
		expect(problemOf('')).toBeUndefined();
		expect(problemOf('export=something-else')).toBeUndefined();
		expect(problemOf('export=unreadable-tokens')).toBeUndefined();
	});
});
