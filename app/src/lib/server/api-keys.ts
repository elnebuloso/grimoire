import { randomBytes } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { sha256 } from './sha256.ts';
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
	/** Requests per day over the last 90 days, the latest day first; days without one are left out. */
	requests: DailyRequests[];
}

export interface DailyRequests {
	/** `YYYY-MM-DD` in the time zone of the instance. */
	day: string;
	requests: number;
}

/** The moment of a request, and its calendar date in the time zone of the instance. */
export interface Clock {
	now: Date;
	/** `YYYY-MM-DD` */
	today: string;
}

// A burst of agent requests writes the last use once, not once per request.
const LAST_USE_PRECISION_MS = 60_000;
const KEEP_REQUEST_DAYS = 90;

// Requests counted since they were last written, by key and day; written with the last use. Per
// database, so connections never mix their keys.
// shortcut: what was counted in the minute before a restart is lost; flush on shutdown once
// exact counts matter.
const unwrittenRequests = new WeakMap<DatabaseSync, Map<number, Map<string, number>>>();

function unwrittenFor(db: DatabaseSync): Map<number, Map<string, number>> {
	let byKey = unwrittenRequests.get(db);
	if (!byKey) unwrittenRequests.set(db, (byKey = new Map()));
	return byKey;
}

function countRequest(db: DatabaseSync, keyId: number, day: string) {
	const byKey = unwrittenFor(db);
	const days = byKey.get(keyId) ?? new Map<string, number>();
	days.set(day, (days.get(day) ?? 0) + 1);
	byKey.set(keyId, days);
}

/** Writes the counted requests of a key and removes the days that are no longer kept. */
function writeRequests(db: DatabaseSync, keyId: number, today: string) {
	const days = unwrittenFor(db).get(keyId);
	unwrittenFor(db).delete(keyId);
	const add = db.prepare(
		`INSERT INTO api_key_requests (api_key_id, day, requests) VALUES (?, ?, ?)
		ON CONFLICT (api_key_id, day) DO UPDATE SET requests = requests + excluded.requests`
	);
	for (const [day, requests] of days ?? []) add.run(keyId, day, requests);
	db.prepare('DELETE FROM api_key_requests WHERE day <= ?').run(
		daysBefore(today, KEEP_REQUEST_DAYS)
	);
}

/** The calendar date `days` before `day`, both `YYYY-MM-DD`. */
function daysBefore(day: string, days: number): string {
	return new Date(Date.parse(`${day}T00:00:00Z`) - days * 86_400_000).toISOString().slice(0, 10);
}

/** Whether a key valid until `validUntil` is rejected on `today`; both are `YYYY-MM-DD`. */
export function isExpired(validUntil: string | null, today: string): boolean {
	return validUntil !== null && validUntil < today;
}

/** What a key action refuses instead of throwing: everything else is a broken database. */
export type ApiKeyRefusal = { error: 'unknown-source' } | { error: 'unknown-key' };

/**
 * Creates a key for all sources or a selection of source slugs, accepted through `validUntil`
 * when given, owned by `ownerId`. The returned key is the only copy: the database keeps just its
 * hash. A source that does not exist stores nothing.
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
		const sourceIds = findSourceIds(db, sources);
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
		const sourceIds = findSourceIds(db, sources);
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

/** The keys of `ownerId`, or every key, with their scope and owner; neither the key nor its hash. */
export function listApiKeys(db: DatabaseSync, ownerId?: number): ApiKey[] {
	const rows = db
		.prepare(
			`SELECT api_keys.id, api_keys.name, users.email AS owner, api_keys.created_at AS createdAt,
				api_keys.last_used_at AS lastUsedAt, api_keys.valid_until AS validUntil,
				api_keys.all_sources,
				json_group_array(sources.slug) FILTER (WHERE sources.slug IS NOT NULL) AS slugs,
				(SELECT json_group_object(day, requests) FROM api_key_requests
					WHERE api_key_id = api_keys.id) AS requests
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
		requests: string;
	}[];
	return rows.map((row) => ({
		id: row.id,
		name: row.name,
		owner: row.owner,
		createdAt: row.createdAt,
		lastUsedAt: row.lastUsedAt,
		validUntil: row.validUntil,
		sources: row.all_sources === 1 ? 'all' : (JSON.parse(row.slugs) as string[]).sort(),
		requests: dailyRequests(db, row.id, JSON.parse(row.requests) as Record<string, number>)
	}));
}

/** The written counts of a key with what is counted but not written yet, the latest day first. */
function dailyRequests(
	db: DatabaseSync,
	keyId: number,
	written: Record<string, number>
): DailyRequests[] {
	const counts = new Map(Object.entries(written));
	for (const [day, requests] of unwrittenFor(db).get(keyId) ?? []) {
		counts.set(day, (counts.get(day) ?? 0) + requests);
	}
	return [...counts]
		.map(([day, requests]) => ({ day, requests }))
		.sort((a, b) => (a.day < b.day ? 1 : -1));
}

/**
 * Deletes a key, only one of `ownerId` when given; nothing caches keys, so the next request with
 * it is rejected.
 */
/** Deletes the key, of `ownerId` only when given; false when there was no such key. */
export function revokeApiKey(db: DatabaseSync, id: number, ownerId?: number): boolean {
	const { changes } = db
		.prepare('DELETE FROM api_keys WHERE id = :id AND (:owner IS NULL OR owner_id = :owner)')
		.run({ id, owner: ownerId ?? null });
	if (!db.prepare('SELECT 1 FROM api_keys WHERE id = ?').get(id)) unwrittenFor(db).delete(id);
	return changes > 0;
}

/** Every source a key can be scoped to, by name, as the source picker offers them. */
export function sourceChoices(db: DatabaseSync): { slug: string; name: string }[] {
	return db.prepare('SELECT slug, name FROM sources ORDER BY name, slug').all() as {
		slug: string;
		name: string;
	}[];
}

/**
 * The sources a key may see, or undefined when the key is unknown
 * or expired and must be rejected. Counts the request of an accepted key and writes its last use
 * and counts at most once a minute.
 */
export function scopeForKey(
	db: DatabaseSync,
	key: string,
	clock: Clock
): { scope: SourceScope } | undefined {
	const row = db
		.prepare(`SELECT id, all_sources, last_used_at, valid_until FROM api_keys WHERE key_hash = ?`)
		.get(sha256(key)) as
		| {
				id: number;
				all_sources: number;
				last_used_at: string | null;
				valid_until: string | null;
		  }
		| undefined;
	if (!row || isExpired(row.valid_until, clock.today)) return undefined;
	countRequest(db, row.id, clock.today);
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
		writeRequests(db, row.id, clock.today);
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
