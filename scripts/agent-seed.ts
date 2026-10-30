// Resets the database of the agent environment to the fixture data: an admin account, an API key
// and sources in every state the admin area shows. Safe while the server runs: the file is kept
// and rewritten in one transaction, so the server's connection stays valid.
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
// Plain node runs this, without Vite: no `import.meta.glob`, so the migrations are read here, and
// an imported `.ts` file needs its extension and may import npm packages and `node:` modules, but
// nothing that needs Vite (`#lib`, `$app`).
import { migrate } from '../app/src/lib/server/db/migrate.ts';
import { hashPassword } from '../app/src/lib/server/admin/auth.ts';
import { hashKey } from '../app/src/lib/server/api-keys.ts';

const FIXTURE_REPOSITORY = 'https://github.com/elnebuloso/grimoire-fixture-docs';
const MIGRATIONS = join(import.meta.dirname, '../app/src/lib/server/db/migrations');

const path = process.argv[2];
if (!path) throw new Error('usage: node scripts/agent-seed.ts <database path>');

mkdirSync(dirname(path), { recursive: true });
const db = new DatabaseSync(path, { timeout: 5000 });
db.exec('PRAGMA journal_mode = WAL');
migrate(
	db,
	readdirSync(MIGRATIONS)
		.sort()
		.map((name) => ({ name, sql: readFileSync(join(MIGRATIONS, name), 'utf8') }))
);
db.exec('PRAGMA foreign_keys = ON');

const agentPasswordHash = await hashPassword('agent-password');

db.exec('BEGIN IMMEDIATE');
try {
	// Every table the migrations created, so a new one needs no entry here; FTS shadow tables
	// follow their virtual table. Deferred, because the deletes run in no particular order.
	db.exec('PRAGMA defer_foreign_keys = ON');
	const tables = db
		.prepare(
			`SELECT name FROM pragma_table_list
			WHERE schema = 'main' AND type IN ('table', 'virtual')
				AND name NOT LIKE 'sqlite\\_%' ESCAPE '\\' AND name != 'settings'`
		)
		.all() as { name: string }[];
	for (const { name } of tables) {
		db.exec(`DELETE FROM "${name}"`);
	}
	// Back to the defaults of every setting, including ones added later.
	db.exec('DELETE FROM settings; INSERT INTO settings (id) VALUES (1)');

	const agent = db
		.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)')
		.run('agent@example.com', agentPasswordHash);
	db.prepare("INSERT INTO user_roles (user_id, role) VALUES (?, 'admin')").run(
		agent.lastInsertRowid
	);
	db.prepare('INSERT INTO api_keys (name, key_hash, all_projects) VALUES (?, ?, 1)').run(
		'agent',
		hashKey('grimoire_agent-fixture-key')
	);

	const insertProject = db.prepare(
		'INSERT INTO projects (slug, name, description) VALUES (?, ?, ?)'
	);
	const platform = insertProject.run(
		'platform',
		'Platform',
		'Platform team handbook'
	).lastInsertRowid;
	const billing = insertProject.run(
		'billing',
		'Billing',
		'Billing team documentation'
	).lastInsertRowid;

	const insertSource = db.prepare(
		`INSERT INTO sources (project_id, slug, name, git_url, branch, path, paused)
		 VALUES (?, ?, ?, ?, 'main', ?, ?)`
	);
	insertSource.run(platform, 'docs', 'Docs', FIXTURE_REPOSITORY, 'zensical/docs', 0);
	insertSource.run(billing, 'docs', 'Docs', FIXTURE_REPOSITORY, 'mkdocs/docs', 0);
	// The path does not exist in the repository, so every sync fails.
	insertSource.run(billing, 'archive', 'Archive', FIXTURE_REPOSITORY, 'archive/docs', 0);
	// Paused before its first check: polling never syncs it, only "sync now" does.
	insertSource.run(platform, 'next', 'Next', FIXTURE_REPOSITORY, 'zensical/docs', 1);
	db.exec('COMMIT');
} catch (error) {
	if (db.isTransaction) db.exec('ROLLBACK');
	throw error;
}
db.close();
console.log(`Fixture data written to ${path}.`);
