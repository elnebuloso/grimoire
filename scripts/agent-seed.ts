// Resets the database of the agent environment to the fixture data: an admin account, an API key
// and sources in every state the admin area shows. The schema is built again from the migrations,
// which change in place until 1.0. Safe while the server runs: the file is kept and rewritten in
// one transaction, so the server's connection stays valid.
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
// Plain node runs this, without Vite: no `import.meta.glob`, so the migrations are read here, and
// an imported `.ts` file needs its extension and may import npm packages and `node:` modules, but
// nothing that needs Vite (`#lib`, `$app`).
import { hashPassword, sha256 } from '../app/src/lib/server/admin/auth.ts';

const FIXTURE_REPOSITORY = 'https://github.com/elnebuloso/grimoire-fixture-docs';
const MIGRATIONS = join(import.meta.dirname, '../app/src/lib/server/db/migrations');

const path = process.argv[2];
if (!path) throw new Error('usage: node scripts/agent-seed.ts <database path>');

mkdirSync(dirname(path), { recursive: true });
const db = new DatabaseSync(path, { timeout: 5000 });
db.exec('PRAGMA journal_mode = WAL');
const migrations = readdirSync(MIGRATIONS).sort();

const agentPasswordHash = await hashPassword('agent-password');

db.exec('BEGIN IMMEDIATE');
try {
	// Views first, since they read the tables. Indexes, triggers and FTS shadow tables go with
	// their table.
	const objects = db
		.prepare(
			`SELECT name, type FROM pragma_table_list
			WHERE schema = 'main' AND type IN ('view', 'table', 'virtual')
				AND name NOT LIKE 'sqlite\\_%' ESCAPE '\\'
			ORDER BY type = 'view' DESC`
		)
		.all() as { name: string; type: string }[];
	for (const { name, type } of objects) {
		db.exec(`DROP ${type === 'view' ? 'VIEW' : 'TABLE'} IF EXISTS "${name}"`);
	}
	for (const name of migrations) {
		db.exec(readFileSync(join(MIGRATIONS, name), 'utf8'));
	}
	db.exec(`PRAGMA user_version = ${migrations.length}`);

	const agent = db
		.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)')
		.run('agent@example.com', agentPasswordHash);
	db.prepare("INSERT INTO user_roles (user_id, role) VALUES (?, 'admin')").run(
		agent.lastInsertRowid
	);
	db.prepare('INSERT INTO api_keys (name, key_hash, all_sources) VALUES (?, ?, 1)').run(
		'agent',
		sha256('grimoire_agent-fixture-key')
	);

	const insertSource = db.prepare(
		`INSERT INTO sources (slug, name, description, git_url, branch, path, paused, public)
		 VALUES (?, ?, ?, ?, 'main', ?, ?, ?)`
	);
	insertSource.run(
		'platform-docs',
		'Platform docs',
		'Platform team handbook',
		FIXTURE_REPOSITORY,
		'zensical/docs',
		0,
		0
	);
	// Public, so keyless MCP and HTTP and the query form on the start page can be tried without
	// changing a source by hand; platform-docs stays private to check the boundary against.
	insertSource.run(
		'billing-docs',
		'Billing docs',
		'Billing team documentation',
		FIXTURE_REPOSITORY,
		'mkdocs/docs',
		0,
		1
	);
	// The path does not exist in the repository, so every sync fails.
	insertSource.run(
		'billing-archive',
		'Billing archive',
		'',
		FIXTURE_REPOSITORY,
		'archive/docs',
		0,
		0
	);
	// Paused before its first check: polling never syncs it, only "sync now" does.
	insertSource.run('platform-next', 'Platform next', '', FIXTURE_REPOSITORY, 'zensical/docs', 1, 0);
	db.exec('COMMIT');
} catch (error) {
	if (db.isTransaction) db.exec('ROLLBACK');
	throw error;
}
db.close();
console.log(`Fixture data written to ${path}.`);
