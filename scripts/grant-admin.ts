// Gives an existing account the role admin, for when no admin can log in any more: the admin left,
// lost the password without mail, or lost their login provider. Whoever may run this already has
// the database; it deletes nothing.
import { existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
// Plain node runs this, without Vite: no `import.meta.glob`, so no migrations, and an imported
// `.ts` file needs its extension and may import npm packages and `node:` modules, but nothing
// that needs Vite (`#lib`, `$app`).
import {
	grantAdmin,
	hashPassword,
	MIN_PASSWORD_LENGTH,
	type GrantResult
} from '../app/src/lib/server/admin/auth.ts';

const SQLITE_BUSY = 5;

// What arrived after the line just read: pasted or piped input can bring both lines at once.
let pending = '';

const [email, option] = process.argv.slice(2);
if (!email || (option !== undefined && option !== '--password')) {
	console.error('usage: node scripts/grant-admin.ts <email address> [--password]');
	process.exit(1);
}
const path = process.env.DATABASE_PATH;
if (!path || !existsSync(path)) throw new Error(`no database at "${path}"`);

let passwordHash: string | undefined;
if (option === '--password') {
	if (!process.stdin.isTTY) {
		console.error('Run this in a terminal: the new password is typed there, not passed along.');
		process.exit(1);
	}
	const password = await readHidden('New password: ');
	if (password.length < MIN_PASSWORD_LENGTH) {
		console.error(
			`The password needs at least ${MIN_PASSWORD_LENGTH} characters; nothing was changed.`
		);
		process.exit(1);
	}
	if ((await readHidden('Repeat it: ')) !== password) {
		console.error('The passwords differ; nothing was changed.');
		process.exit(1);
	}
	passwordHash = await hashPassword(password);
}

// The server keeps running beside this script: wait for a write of it to finish, as it waits too.
const db = new DatabaseSync(path, { timeout: 5000 });
let result: GrantResult;
try {
	result = grantAdmin(db, email, passwordHash);
} catch (error) {
	if ((error as { errcode?: number }).errcode !== SQLITE_BUSY) throw error;
	console.error('The database stayed locked by a write of the server; nothing was changed.');
	console.error('Run this again in a moment.');
	process.exit(1);
} finally {
	db.close();
}
if (result === 'unknown-account') {
	console.error('No account has that email address; nothing was changed.');
	process.exit(1);
}
console.log(
	result === 'granted' ? 'The account is now an admin.' : 'The account already is an admin.'
);
if (passwordHash) console.log('Its password was set and its sessions were ended.');

/** Reads a line from the terminal without echoing it. */
function readHidden(question: string): Promise<string> {
	process.stdout.write(question);
	process.stdin.setRawMode(true);
	process.stdin.setEncoding('utf8');
	let typed = '';
	return new Promise((resolve) => {
		const onData = (chunk: string) => {
			const characters = [...chunk];
			for (const [index, character] of characters.entries()) {
				if (character === '\u0003') process.exit(130);
				if (character === '\r' || character === '\n') {
					pending = characters
						.slice(index + 1)
						.join('')
						.replace(/^\n/, '');
					process.stdin.off('data', onData);
					process.stdin.setRawMode(false);
					process.stdin.pause();
					process.stdout.write('\n');
					resolve(typed);
					return;
				}
				typed = character === '\u007f' ? typed.slice(0, -1) : typed + character;
			}
		};
		process.stdin.on('data', onData);
		if (pending) {
			const earlier = pending;
			pending = '';
			onData(earlier);
		}
		process.stdin.resume();
	});
}
