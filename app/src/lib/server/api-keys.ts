import { createHash, randomBytes } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { inTransaction } from './db/transaction.ts';

// The prefix lets secret scanners recognise a leaked key.
const KEY_PREFIX = 'grimoire_';
const KEY_BYTES = 32;

/** The sources a key opens: all of them, or a selection of source slugs. */
export type KeyScope = 'all' | string[];

/**
 * The sources a caller may see: what its key opens and the public ones; only the public ones
 * (`'public'`) for a request without a key.
 */
export type SourceScope = KeyScope | 'public';

export interface ApiKey {
	id: number;
	name: string;
	createdAt: string;
	/** Null for a key that never authenticated a request. */
	lastUsedAt: string | null;
	/** The last day, `YYYY-MM-DD` in the time zone of the instance, the key is accepted; null for no expiry. */
	validUntil: string | null;
	sources: KeyScope;
}

/** The moment of a request, and its calendar date in the time zone of the instance. */
export interface Clock {
	now: Date;
	/** `YYYY-MM-DD` */
	today: string;
}

// A burst of agent requests writes the last use once, not once per request.
const LAST_USE_PRECISION_MS = 60_000;

/** Whether a key valid until `validUntil` is rejected on `today`; both are `YYYY-MM-DD`. */
export function isExpired(validUntil: string | null, today: string): boolean {
	return validUntil !== null && validUntil < today;
}

// A slow hash protects passwords people choose; a random 256-bit key cannot be guessed, so
// SHA-256 suffices and a key is found by a plain lookup on the unique hash.
export function hashKey(key: string): string {
	return createHash('sha256').update(key).digest('hex');
}

/** What a key action refuses instead of throwing: everything else is a broken database. */
export type ApiKeyRefusal = { error: 'unknown-source' } | { error: 'unknown-key' };

/**
 * Creates a key for all sources or a selection of source slugs, accepted through `validUntil`
 * when given. The returned key is the only copy: the database keeps just its hash. An unknown
 * source stores nothing.
 */
export function createApiKey(
	db: DatabaseSync,
	name: string,
	sources: KeyScope,
	validUntil: string | null = null
): { id: number; key: string } | { error: 'unknown-source' } {
	const key = KEY_PREFIX + randomBytes(KEY_BYTES).toString('base64url');
	return inTransaction(db, () => {
		const sourceIds = findSourceIds(db, sources);
		if (!sourceIds) return { error: 'unknown-source' };
		const id = Number(
			db
				.prepare(
					'INSERT INTO api_keys (name, key_hash, all_sources, valid_until) VALUES (?, ?, ?, ?)'
				)
				.run(name, hashKey(key), sources === 'all' ? 1 : 0, validUntil).lastInsertRowid
		);
		insertScope(db, id, sourceIds);
		return { id, key };
	});
}

/**
 * Changes the sources a key sees and how long it is accepted; the key itself stays the same.
 * An unknown source or key changes nothing.
 */
export function updateApiKey(
	db: DatabaseSync,
	id: number,
	sources: KeyScope,
	validUntil: string | null
): { id: number } | ApiKeyRefusal {
	return inTransaction(db, () => {
		const sourceIds = findSourceIds(db, sources);
		if (!sourceIds) return { error: 'unknown-source' };
		const { changes } = db
			.prepare('UPDATE api_keys SET all_sources = ?, valid_until = ? WHERE id = ?')
			.run(sources === 'all' ? 1 : 0, validUntil, id);
		if (changes === 0) return { error: 'unknown-key' };
		db.prepare('DELETE FROM api_key_sources WHERE api_key_id = ?').run(id);
		insertScope(db, id, sourceIds);
		return { id };
	});
}

/** The IDs of the selected sources, none for all sources, undefined if a slug is unknown. */
function findSourceIds(db: DatabaseSync, sources: KeyScope): number[] | undefined {
	if (sources === 'all') return [];
	const findSource = db.prepare('SELECT id FROM sources WHERE slug = ?');
	const ids: number[] = [];
	for (const slug of sources) {
		const source = findSource.get(slug) as { id: number } | undefined;
		if (!source) return undefined;
		ids.push(source.id);
	}
	return ids;
}

function insertScope(db: DatabaseSync, id: number, sourceIds: number[]) {
	const insertSource = db.prepare(
		'INSERT OR IGNORE INTO api_key_sources (api_key_id, source_id) VALUES (?, ?)'
	);
	for (const sourceId of sourceIds) insertSource.run(id, sourceId);
}

/** All keys with their scope; neither the key nor its hash. */
export function listApiKeys(db: DatabaseSync): ApiKey[] {
	const rows = db
		.prepare(
			// CURRENT_TIMESTAMP is UTC but has no zone, which a Date would read as local time.
			`SELECT api_keys.id, api_keys.name,
				strftime('%Y-%m-%dT%H:%M:%fZ', api_keys.created_at) AS createdAt,
				api_keys.last_used_at AS lastUsedAt, api_keys.valid_until AS validUntil,
				api_keys.all_sources,
				json_group_array(sources.slug) FILTER (WHERE sources.slug IS NOT NULL) AS slugs
			FROM api_keys
			LEFT JOIN api_key_sources ON api_key_sources.api_key_id = api_keys.id
			LEFT JOIN sources ON sources.id = api_key_sources.source_id
			GROUP BY api_keys.id
			ORDER BY api_keys.name, api_keys.id`
		)
		.all() as {
		id: number;
		name: string;
		createdAt: string;
		lastUsedAt: string | null;
		validUntil: string | null;
		all_sources: number;
		slugs: string;
	}[];
	return rows.map((row) => ({
		id: row.id,
		name: row.name,
		createdAt: row.createdAt,
		lastUsedAt: row.lastUsedAt,
		validUntil: row.validUntil,
		sources: row.all_sources === 1 ? 'all' : (JSON.parse(row.slugs) as string[]).sort()
	}));
}

/** Deletes a key; nothing caches keys, so the next request with it is rejected. */
export function revokeApiKey(db: DatabaseSync, id: number) {
	db.prepare('DELETE FROM api_keys WHERE id = ?').run(id);
}

/**
 * The sources a key may see, or undefined when the key is unknown or expired and must be
 * rejected. Records the use of an accepted key, at most once a minute.
 */
export function scopeForKey(
	db: DatabaseSync,
	key: string,
	clock: Clock
): { scope: SourceScope } | undefined {
	const row = db
		.prepare(`SELECT id, all_sources, last_used_at, valid_until FROM api_keys WHERE key_hash = ?`)
		.get(hashKey(key)) as
		| { id: number; all_sources: number; last_used_at: string | null; valid_until: string | null }
		| undefined;
	if (!row || isExpired(row.valid_until, clock.today)) return undefined;
	// Decided here, not in the UPDATE's WHERE: an UPDATE takes the write lock even when it
	// changes no row.
	if (
		row.last_used_at === null ||
		clock.now.getTime() - Date.parse(row.last_used_at) >= LAST_USE_PRECISION_MS
	) {
		db.prepare('UPDATE api_keys SET last_used_at = ? WHERE id = ?').run(
			clock.now.toISOString(),
			row.id
		);
	}
	if (row.all_sources === 1) return { scope: 'all' };
	const slugs = db
		.prepare(
			`SELECT sources.slug FROM api_key_sources
			JOIN sources ON sources.id = api_key_sources.source_id
			WHERE api_key_sources.api_key_id = ?
			ORDER BY sources.slug`
		)
		.all(row.id) as { slug: string }[];
	return { scope: slugs.map((source) => source.slug) };
}
