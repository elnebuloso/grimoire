import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { openDatabase } from './schema';

const script = join(import.meta.dirname, '../../../../../scripts/backup.ts');

let directory: string;
let path: string;

function runBackup(...args: string[]) {
	return spawnSync(process.execPath, [script, ...args], {
		env: { ...process.env, DATABASE_PATH: path },
		encoding: 'utf8'
	});
}

function sourceSlugs(file: string): string[] {
	const db = new DatabaseSync(file, { readOnly: true });
	const rows = db.prepare('SELECT slug FROM sources ORDER BY slug').all() as { slug: string }[];
	db.close();
	return rows.map((row) => row.slug);
}

beforeEach(() => {
	directory = mkdtempSync(join(tmpdir(), 'grimoire-backup-'));
	path = join(directory, 'grimoire.db');
	const db = openDatabase(path);
	db.exec(
		"INSERT INTO sources (slug, name, git_url, branch, path) VALUES ('billing', 'Billing', 'https://git.example.com/billing.git', 'main', 'docs')"
	);
	db.close();
});

afterEach(() => rmSync(directory, { recursive: true, force: true }));

describe('scripts/backup.ts', () => {
	it('copies the committed state while the server is in the middle of a write', () => {
		const server = openDatabase(path);
		server.exec('BEGIN IMMEDIATE');
		server.exec(
			"INSERT INTO sources (slug, name, git_url, branch, path) VALUES ('platform', 'Platform', 'https://git.example.com/platform.git', 'main', 'docs')"
		);

		const result = runBackup(join(directory, 'backup.db'));
		server.exec('COMMIT');
		server.close();

		expect(result.stderr).toBe('');
		expect(result.status).toBe(0);
		expect(sourceSlugs(join(directory, 'backup.db'))).toEqual(['billing']);
	});

	it('refuses a target that exists and leaves it as it was', () => {
		const target = join(directory, 'backup.db');
		writeFileSync(target, 'an earlier backup');

		const result = runBackup(target);

		expect(result.status).toBe(1);
		expect(result.stderr).toContain('exists already; name a new file');
		expect(readFileSync(target, 'utf8')).toBe('an earlier backup');
	});

	it('asks for a target when none is given', () => {
		const result = runBackup();

		expect(result.status).toBe(1);
		expect(result.stderr).toContain('Name the file to write');
	});
});
