// Imports an export into the empty instance at DATABASE_PATH, creating the database if there is
// none yet. Runs beside the server as well as before its first start.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
// Plain node runs this, without Vite: no `import.meta.glob`, so the migrations are read from their
// folder, which the image ships with the server's source.
import { openMigratedDatabase } from '../app/src/lib/server/db/migrate.ts';
import { importExport, type ImportProblem } from '../app/src/lib/server/instance-import.ts';
import { parseEncryptionKey } from '../app/src/lib/server/secret-encryption.ts';
import { isDatabaseBusy, readHidden } from './prompt.ts';
import {
	connectionPolicy,
	parseAllowedHosts,
	refusedSources
} from '../app/src/lib/server/sync/connection-policy.ts';

const MIGRATIONS = join(import.meta.dirname, '../app/src/lib/server/db/migrations');

const PROBLEMS: Record<ImportProblem, string> = {
	'instance-not-empty':
		'This instance has users or sources already; an export is imported only into an empty one.',
	'not-an-export': 'The file is not a grimoire export.',
	'newer-format':
		'The export comes from a newer grimoire; import it with that version or a later one.',
	'newer-schema':
		'The export comes from a newer grimoire; import it with that version or a later one.',
	'wrong-passphrase-or-damaged':
		'The passphrase is wrong, or the file was changed or cut short since it was exported.'
};

const file = process.argv[2];
const path = process.env.DATABASE_PATH;
if (!file)
	fail('Name the export to import, such as: node scripts/import.ts /tmp/grimoire.grimoire-export');
if (!existsSync(file)) fail(`There is no file "${file}".`);
if (!path) fail('DATABASE_PATH is not set; nothing was imported.');
let tokenKey: Buffer;
try {
	tokenKey = parseEncryptionKey(process.env.ENCRYPTION_KEY).sourceTokens;
} catch (error) {
	fail(`ENCRYPTION_KEY ${(error as Error).message}; nothing was imported.`);
}
if (!process.stdin.isTTY) fail('Run this in a terminal: it asks for the passphrase of the export.');

const migrations = readdirSync(MIGRATIONS)
	.sort()
	.map((name) => ({ name, sql: readFileSync(join(MIGRATIONS, name), 'utf8') }));
let db: DatabaseSync;
try {
	db = openMigratedDatabase(path, migrations);
} catch (error) {
	failWhenBusy(error);
}
try {
	const passphrase = await readHidden('Passphrase of the export: ');
	const result = await importExport(db, readFileSync(file), passphrase, migrations, tokenKey);
	if ('error' in result) fail(`${PROBLEMS[result.error]} Nothing was imported.`);
	console.log(
		`Imported ${result.users} users and ${result.sources} sources. Log in with an imported account; the pages come back with the first sync of each source.`
	);
	const policy = connectionPolicy(parseAllowedHosts(process.env.GIT_ALLOWED_HOSTS));
	for (const { slug, reason } of await refusedSources(db, policy)) {
		console.log(`Source ${slug} cannot sync: ${reason}`);
	}
} catch (error) {
	failWhenBusy(error);
} finally {
	db.close();
}

// The server keeps running beside this script and may hold the write lock for a moment.
function failWhenBusy(error: unknown): never {
	if (!isDatabaseBusy(error)) throw error;
	fail(
		'The database stayed locked by a write of the server; nothing was imported. Run this again in a moment.'
	);
}

function fail(message: string): never {
	console.error(message);
	process.exit(1);
}
