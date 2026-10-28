import type { DatabaseSync } from 'node:sqlite';
import { openMigratedDatabase, type Migration } from './migrate';

// Bundled into the build, so the image needs no migrations folder next to it.
const files = import.meta.glob<string>('./migrations/*.sql', {
	query: '?raw',
	import: 'default',
	eager: true
});

export const migrations: Migration[] = Object.entries(files)
	.map(([path, sql]) => ({ name: path.slice(path.lastIndexOf('/') + 1), sql }))
	.sort((a, b) => (a.name < b.name ? -1 : 1));

/** Opens the SQLite file at `path` and brings its schema up to date. */
export function openDatabase(path: string): DatabaseSync {
	return openMigratedDatabase(path, migrations);
}
