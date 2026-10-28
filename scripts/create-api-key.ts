// Creates an API key until the admin area can. Runs in app/ with its .env loaded.
import { existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { createApiKey } from '../app/src/lib/server/api-keys.ts';

const [name, projects] = process.argv.slice(2);
const path = process.env.DATABASE_PATH;
if (!name) throw new Error('usage: make api-key NAME=<name> [PROJECTS=<slug>,<slug>]');
// The schema is migrated by the server, which bundles the migrations; plain node cannot.
if (!path || !existsSync(path)) {
	throw new Error(`no database at "${path}": start the server once to create it`);
}

const db = new DatabaseSync(path);
const { key } = createApiKey(db, name, projects ? projects.split(',') : 'all');
db.close();
console.log(key);
