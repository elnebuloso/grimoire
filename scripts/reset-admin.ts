// Deletes the admin account and all sessions when its password is lost. Whoever may run this
// already has the database; the confirmation only guards against running it by accident.
import { existsSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { DatabaseSync } from 'node:sqlite';
// Plain node runs this, without Vite: no `import.meta.glob`, so no migrations, and an imported
// `.ts` file needs its extension and may import npm packages and `node:` modules, but nothing
// that needs Vite (`#lib`, `$app`).
import { resetAdmin } from '../app/src/lib/server/admin/auth.ts';

const SQLITE_BUSY = 5;

const path = process.env.DATABASE_PATH;
if (!path || !existsSync(path)) throw new Error(`no database at "${path}"`);
if (!process.stdin.isTTY) {
	console.error(
		'Run this in a terminal: it asks for the admin email address to confirm the reset.'
	);
	process.exit(1);
}

const prompt = createInterface({ input: process.stdin, output: process.stdout });
const email = await prompt.question('Email address of the admin account to delete: ');
prompt.close();

// The server keeps running beside this script: wait for a write of it to finish, as it waits too.
const db = new DatabaseSync(path, { timeout: 5000 });
let reset: boolean;
try {
	reset = resetAdmin(db, email);
} catch (error) {
	if ((error as { errcode?: number }).errcode !== SQLITE_BUSY) throw error;
	console.error('The database stayed locked by a write of the server; nothing was changed.');
	console.error('Run this again in a moment.');
	process.exit(1);
} finally {
	db.close();
}
if (!reset) {
	console.error('That is not the email address of an admin; nothing was changed.');
	process.exit(1);
}
console.log('Admin account and sessions deleted. Open /setup to set it up again;');
console.log('the new setup token is in the server log.');
