// Deletes the admin account and all sessions when its password is lost. Whoever may run this
// already has the database; the confirmation only guards against running it by accident.
import { existsSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { DatabaseSync } from 'node:sqlite';
// Plain node runs this, without Vite: no `import.meta.glob`, so no migrations, and an imported
// `.ts` file needs its extension and may itself import only `node:` modules.
import { resetAdmin } from '../app/src/lib/server/admin/auth.ts';

const path = process.env.DATABASE_PATH;
if (!path || !existsSync(path)) throw new Error(`no database at "${path}"`);
if (!process.stdin.isTTY) {
	console.error('Run this in a terminal: it asks for the admin username to confirm the reset.');
	process.exit(1);
}

const prompt = createInterface({ input: process.stdin, output: process.stdout });
const username = await prompt.question('Username of the admin account to delete: ');
prompt.close();

const db = new DatabaseSync(path);
const reset = resetAdmin(db, username);
db.close();
if (!reset) {
	console.error('That is not the admin username; nothing was changed.');
	process.exit(1);
}
console.log('Admin account and sessions deleted. Open /admin to set it up again;');
console.log('the new setup token is in the server log.');
