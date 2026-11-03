import { randomBytes } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { sha256 } from './admin/auth.ts';
import { inTransaction } from './db/transaction.ts';

// The prefix lets secret scanners recognise a leaked key.
const KEY_PREFIX = 'grimoire_';
// A slow hash protects passwords people choose; a random 256-bit key cannot be guessed, so
// SHA-256 suffices and a key is found by a plain lookup on the unique hash.
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
	/** The email address of the owner; null for a key that belongs to nobody. */
	owner: string | null;
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

/** What a key action refuses instead of throwing: everything else is a broken database. */
export type ApiKeyRefusal = { error: 'unknown-source' } | { error: 'unknown-key' };

/**
 * Creates a key for all sources or a selection of source slugs, accepted through `validUntil`
 * when given, owned by `ownerId`. The returned key is the only copy: the database keeps just its
 * hash. A source that does not exist or that the owner may not read stores nothing.
 */
export function createApiKey(
	db: DatabaseSync,
	name: string,
	sources: KeyScope,
	validUntil: string | null = null,
	ownerId: number | null = null
): { id: number; key: string } | { error: 'unknown-source' } {
	const key = KEY_PREFIX + randomBytes(KEY_BYTES).toString('base64url');
	return inTransaction(db, () => {
		const sourceIds = findSourceIds(db, sources, ownerId);
		if (!sourceIds) return { error: 'unknown-source' };
		const id = Number(
			db
				.prepare(
					'INSERT INTO api_keys (name, key_hash, all_sources, valid_until, owner_id) VALUES (?, ?, ?, ?, ?)'
				)
				.run(name, sha256(key), sources === 'all' ? 1 : 0, validUntil, ownerId).lastInsertRowid
		);
		insertScope(db, id, sourceIds);
		return { id, key };
	});
}

/**
 * Changes the sources a key of `ownerId` sees and how long it is accepted; the key itself stays
 * the same. A key of someone else counts as unknown; an unknown key or source changes nothing.
 */
export function updateApiKey(
	db: DatabaseSync,
	id: number,
	sources: KeyScope,
	validUntil: string | null,
	ownerId: number
): { id: number } | ApiKeyRefusal {
	return inTransaction(db, () => {
		const owned = db
			.prepare('SELECT 1 FROM api_keys WHERE id = ? AND owner_id = ?')
			.get(id, ownerId);
		if (!owned) return { error: 'unknown-key' };
		const sourceIds = findSourceIds(db, sources, ownerId);
		if (!sourceIds) return { error: 'unknown-source' };
		// The old selection goes first: the schema refuses a key for all sources that still has one.
		db.prepare('DELETE FROM api_key_sources WHERE api_key_id = ?').run(id);
		db.prepare('UPDATE api_keys SET all_sources = ?, valid_until = ? WHERE id = ?').run(
			sources === 'all' ? 1 : 0,
			validUntil,
			id
		);
		insertScope(db, id, sourceIds);
		return { id };
	});
}

/**
 * The IDs of the selected sources, none for all sources, undefined if a slug is unknown or names
 * a private source of someone other than `ownerId`.
 */
function findSourceIds(
	db: DatabaseSync,
	sources: KeyScope,
	ownerId: number | null
): number[] | undefined {
	if (sources === 'all') return [];
	const findSource = db.prepare(
		"SELECT id FROM sources WHERE slug = ? AND (visibility <> 'private' OR owner_id = ?)"
	);
	const ids: number[] = [];
	for (const slug of sources) {
		const source = findSource.get(slug, ownerId) as { id: number } | undefined;
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

/** The keys of `ownerId`, or every key, with their scope and owner; neither the key nor its hash. */
export function listApiKeys(db: DatabaseSync, ownerId?: number): ApiKey[] {
	const rows = db
		.prepare(
			`SELECT api_keys.id, api_keys.name, users.email AS owner, api_keys.created_at AS createdAt,
				api_keys.last_used_at AS lastUsedAt, api_keys.valid_until AS validUntil,
				api_keys.all_sources,
				json_group_array(sources.slug) FILTER (WHERE sources.slug IS NOT NULL) AS slugs
			FROM api_keys
			LEFT JOIN users ON users.id = api_keys.owner_id
			LEFT JOIN api_key_sources ON api_key_sources.api_key_id = api_keys.id
			LEFT JOIN sources ON sources.id = api_key_sources.source_id
			WHERE :owner IS NULL OR api_keys.owner_id = :owner
			GROUP BY api_keys.id
			ORDER BY api_keys.name, api_keys.id`
		)
		.all({ owner: ownerId ?? null }) as {
		id: number;
		name: string;
		owner: string | null;
		createdAt: string;
		lastUsedAt: string | null;
		validUntil: string | null;
		all_sources: number;
		slugs: string;
	}[];
	return rows.map((row) => ({
		id: row.id,
		name: row.name,
		owner: row.owner,
		createdAt: row.createdAt,
		lastUsedAt: row.lastUsedAt,
		validUntil: row.validUntil,
		sources: row.all_sources === 1 ? 'all' : (JSON.parse(row.slugs) as string[]).sort()
	}));
}

/**
 * Deletes a key, only one of `ownerId` when given; nothing caches keys, so the next request with
 * it is rejected.
 */
export function revokeApiKey(db: DatabaseSync, id: number, ownerId?: number) {
	db.prepare('DELETE FROM api_keys WHERE id = :id AND (:owner IS NULL OR owner_id = :owner)').run({
		id,
		owner: ownerId ?? null
	});
}

/**
 * The slugs of the sources `userId` may read: the public and internal ones and their own private
 * ones. Null for no user, such as a key whose owner was reset: it reads no private source.
 */
export function readableSlugs(db: DatabaseSync, userId: number | null): string[] {
	const rows = db
		.prepare("SELECT slug FROM sources WHERE visibility <> 'private' OR owner_id = ? ORDER BY slug")
		.all(userId) as { slug: string }[];
	return rows.map((row) => row.slug);
}

/**
 * The sources a key may see, within what its owner may read, or undefined when the key is unknown
 * or expired and must be rejected. Records the use of an accepted key, at most once a minute.
 */
export function scopeForKey(
	db: DatabaseSync,
	key: string,
	clock: Clock
): { scope: SourceScope } | undefined {
	const row = db
		.prepare(
			`SELECT id, all_sources, last_used_at, valid_until, owner_id FROM api_keys WHERE key_hash = ?`
		)
		.get(sha256(key)) as
		| {
				id: number;
				all_sources: number;
				last_used_at: string | null;
				valid_until: string | null;
				owner_id: number | null;
		  }
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
	// Decided on every request: a source made private later drops out of other users' keys.
	const readable = readableSlugs(db, row.owner_id);
	if (row.all_sources === 1) return { scope: readable };
	const slugs = db
		.prepare(
			`SELECT sources.slug FROM api_key_sources
			JOIN sources ON sources.id = api_key_sources.source_id
			WHERE api_key_sources.api_key_id = ?
			ORDER BY sources.slug`
		)
		.all(row.id) as { slug: string }[];
	return {
		scope: slugs.map((source) => source.slug).filter((slug) => readable.includes(slug))
	};
}
