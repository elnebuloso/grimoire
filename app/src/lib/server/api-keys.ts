import { createHash, randomBytes } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';

// The prefix lets secret scanners recognise a leaked key.
const KEY_PREFIX = 'grimoire_';
const KEY_BYTES = 32;

/** The projects a key may see: all of them, or a selection of project slugs. */
export type ProjectScope = 'all' | string[];

export interface ApiKey {
	id: number;
	name: string;
	createdAt: string;
	projects: ProjectScope;
}

// A slow hash protects passwords people choose; a random 256-bit key cannot be guessed, so
// SHA-256 suffices and a key is found by a plain lookup on the unique hash.
export function hashKey(key: string): string {
	return createHash('sha256').update(key).digest('hex');
}

/**
 * Creates a key for all projects or a selection of project slugs. The returned key is the only
 * copy: the database keeps just its hash. Throws for an unknown project and stores nothing.
 */
export function createApiKey(
	db: DatabaseSync,
	name: string,
	projects: ProjectScope
): { id: number; key: string } {
	const key = KEY_PREFIX + randomBytes(KEY_BYTES).toString('base64url');
	db.exec('BEGIN IMMEDIATE');
	try {
		const id = Number(
			db
				.prepare('INSERT INTO api_keys (name, key_hash, all_projects) VALUES (?, ?, ?)')
				.run(name, hashKey(key), projects === 'all' ? 1 : 0).lastInsertRowid
		);
		if (projects !== 'all') {
			const findProject = db.prepare('SELECT id FROM projects WHERE slug = ?');
			const insertProject = db.prepare(
				'INSERT OR IGNORE INTO api_key_projects (api_key_id, project_id) VALUES (?, ?)'
			);
			for (const slug of projects) {
				const project = findProject.get(slug) as { id: number } | undefined;
				if (!project) throw new Error(`project "${slug}" does not exist`);
				insertProject.run(id, project.id);
			}
		}
		db.exec('COMMIT');
		return { id, key };
	} catch (error) {
		if (db.isTransaction) db.exec('ROLLBACK');
		throw error;
	}
}

/** All keys with their scope; neither the key nor its hash. */
export function listApiKeys(db: DatabaseSync): ApiKey[] {
	const rows = db
		.prepare(
			// CURRENT_TIMESTAMP is UTC but has no zone, which a Date would read as local time.
			`SELECT api_keys.id, api_keys.name,
				strftime('%Y-%m-%dT%H:%M:%fZ', api_keys.created_at) AS createdAt, api_keys.all_projects,
				json_group_array(projects.slug) FILTER (WHERE projects.slug IS NOT NULL) AS slugs
			FROM api_keys
			LEFT JOIN api_key_projects ON api_key_projects.api_key_id = api_keys.id
			LEFT JOIN projects ON projects.id = api_key_projects.project_id
			GROUP BY api_keys.id
			ORDER BY api_keys.name, api_keys.id`
		)
		.all() as {
		id: number;
		name: string;
		createdAt: string;
		all_projects: number;
		slugs: string;
	}[];
	return rows.map((row) => ({
		id: row.id,
		name: row.name,
		createdAt: row.createdAt,
		projects: row.all_projects === 1 ? 'all' : (JSON.parse(row.slugs) as string[]).sort()
	}));
}

/** Deletes a key; nothing caches keys, so the next request with it is rejected. */
export function revokeApiKey(db: DatabaseSync, id: number) {
	db.prepare('DELETE FROM api_keys WHERE id = ?').run(id);
}

/** The projects a key may see, or undefined when the key is unknown and must be rejected. */
export function scopeForKey(db: DatabaseSync, key: string): { scope: ProjectScope } | undefined {
	const row = db
		.prepare('SELECT id, all_projects FROM api_keys WHERE key_hash = ?')
		.get(hashKey(key)) as { id: number; all_projects: number } | undefined;
	if (!row) return undefined;
	if (row.all_projects === 1) return { scope: 'all' };
	const slugs = db
		.prepare(
			`SELECT projects.slug FROM api_key_projects
			JOIN projects ON projects.id = api_key_projects.project_id
			WHERE api_key_projects.api_key_id = ?
			ORDER BY projects.slug`
		)
		.all(row.id) as { slug: string }[];
	return { scope: slugs.map((project) => project.slug) };
}
