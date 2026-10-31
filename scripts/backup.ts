// Writes a consistent copy of the database while the server keeps running. VACUUM INTO reads in one
// transaction, so writes of the server neither end up half in the copy nor make it start over.
import { existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const path = process.env.DATABASE_PATH;
const target = process.argv[2];
if (!target) {
	console.error('Name the file to write, such as: node scripts/backup.ts /tmp/grimoire-backup.db');
	process.exit(1);
}
if (existsSync(target)) {
	console.error(
		`"${target}" exists already; name a new file, so no earlier backup is overwritten.`
	);
	process.exit(1);
}
if (!path || !existsSync(path)) {
	console.error(`No database at "${path}"; nothing was written.`);
	process.exit(1);
}

// Waits for a write of the server to finish rather than failing at once.
const db = new DatabaseSync(path, { readOnly: true, timeout: 5000 });
let failure: string | undefined;
try {
	db.prepare('VACUUM INTO ?').run(target);
} catch (error) {
	failure = (error as Error).message;
} finally {
	db.close();
}
if (failure) {
	console.error(`Backup failed, nothing was written: ${failure}`);
	process.exit(1);
}
console.log(`Backup written to ${target}.`);
