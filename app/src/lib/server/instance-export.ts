import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'node:crypto';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { promisify } from 'node:util';
import { gunzipSync, gzipSync } from 'node:zlib';
import { migrate, type Migration } from './db/migrate.ts';
import { decryptSecret } from './secret-encryption.ts';

// The file is one line of JSON naming the format, then the encrypted database, gzipped: without
// pages it is mostly empty database pages, one per table and index. The header is authenticated
// with the content, so neither can be changed without the other failing.
const FORMAT = 'grimoire-export';
const FORMAT_VERSION = 1;
// Past this, a file is not an export; it keeps a large upload from being searched for a header.
const MAX_HEADER_BYTES = 1024;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32;
// Far above any real state; keeps a decompressed content from exhausting memory.
const MAX_CONTENT_BYTES = 1024 * 1024 * 1024;
// scrypt as OWASP recommends it (128 MiB, about half a second). Fixed per format version, so a file
// cannot make a reader spend whatever memory it names.
const SCRYPT = { N: 2 ** 17, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };

export const MIN_PASSPHRASE_LENGTH = 12;

/**
 * Tables whose rows exist nowhere else and travel in an export, with the columns that travel. Every
 * other column holds its schema default in the export, as in a new row.
 */
export const EXPORTED_COLUMNS: Record<string, string[]> = {
	users: ['id', 'email', 'password_hash'],
	user_roles: ['user_id', 'role'],
	user_identities: ['user_id', 'issuer', 'subject'],
	sources: [
		'id',
		'slug',
		'name',
		'description',
		'git_url',
		'branch',
		'path',
		'exclusions',
		'username',
		'encrypted_token',
		'docs_url',
		'sync_schedule',
		'paused',
		'visibility'
	],
	api_keys: ['id', 'name', 'key_hash', 'all_sources', 'created_at', 'valid_until', 'owner_id'],
	api_key_sources: ['api_key_id', 'source_id'],
	settings: ['id', 'syncs_paused']
};

/**
 * Columns of exported tables that describe the running instance: what the sources record of their
 * index and their last syncs, and when a key was last used. A column in neither list fails a test.
 */
export const RUNTIME_COLUMNS: Record<string, string[]> = {
	sources: [
		'last_checked_at',
		'last_commit',
		'last_synced_at',
		'index_generation',
		'error',
		'error_kind',
		'failed_commit',
		'warnings'
	],
	api_keys: ['last_used_at']
};

export const EXPORTED_TABLES = Object.keys(EXPORTED_COLUMNS);

/**
 * Tables an export leaves empty: what the next sync rebuilds from Git, and what describes the
 * running instance rather than its content. A table in neither list fails a test.
 */
export const EMPTIED_TABLES = [
	'pages',
	'snippets',
	'snippets_fts',
	'links',
	'sessions',
	'password_resets',
	'invitations',
	'sync_runs',
	'missed_queries',
	'api_key_requests'
];

export type ExportProblem =
	/** Not a file this format describes, or not one at all. */
	| 'not-an-export'
	/** Written by a newer grimoire, in a format version this one does not know. */
	| 'newer-format'
	/** A wrong passphrase, or a file changed or cut short since: the cipher cannot tell them apart. */
	| 'wrong-passphrase-or-damaged';

const scryptAsync = promisify(scrypt) as (
	passphrase: string,
	salt: Buffer,
	length: number,
	options: typeof SCRYPT
) => Promise<Buffer>;

/**
 * Writes the real state of `db`, whose schema is that of `migrations`, into an export encrypted
 * with `passphrase`. Git tokens are decrypted with `tokenKey` and stored in plain text inside it; a
 * token that does not decrypt fails the export with the slugs of its sources, so it is fixed before
 * it is carried along.
 */
export async function writeExport(
	db: DatabaseSync,
	migrations: Migration[],
	tokenKey: Buffer,
	passphrase: string
): Promise<{ file: Buffer } | { error: 'unreadable-tokens'; sources: string[] }> {
	const content = realStateCopy(db, migrations);
	try {
		const unreadable = decryptTokens(content, tokenKey);
		if (unreadable.length > 0) return { error: 'unreadable-tokens', sources: unreadable };
		return { file: await sealExport(content, passphrase) };
	} finally {
		content.close();
	}
}

/** The file of an export holding `content` as it is, encrypted with `passphrase`. */
export async function sealExport(content: DatabaseSync, passphrase: string): Promise<Buffer> {
	return encrypt(gzipSync(content.serialize()), passphrase);
}

/**
 * Reads an export into an in-memory database at the schema version it was written at, Git tokens
 * in plain text. The caller migrates it and closes it.
 */
export async function readExport(
	file: Buffer,
	passphrase: string
): Promise<{ db: DatabaseSync } | { error: ExportProblem }> {
	const newline = file.subarray(0, MAX_HEADER_BYTES + 1).indexOf('\n');
	if (newline < 0) return { error: 'not-an-export' };
	const headerBytes = file.subarray(0, newline);
	const header = parseHeader(headerBytes.toString('utf8'));
	if ('error' in header) return header;

	const body = file.subarray(newline + 1);
	if (body.length < TAG_BYTES) return { error: 'wrong-passphrase-or-damaged' };
	const key = await scryptAsync(passphrase, header.salt, KEY_BYTES, SCRYPT);
	let content: Buffer;
	try {
		const decipher = createDecipheriv('aes-256-gcm', key, header.iv);
		decipher.setAAD(headerBytes);
		decipher.setAuthTag(body.subarray(body.length - TAG_BYTES));
		content = Buffer.concat([decipher.update(body.subarray(0, -TAG_BYTES)), decipher.final()]);
	} catch {
		return { error: 'wrong-passphrase-or-damaged' };
	}
	let unpacked: Buffer;
	try {
		unpacked = gunzipSync(content, { maxOutputLength: MAX_CONTENT_BYTES });
	} catch {
		// Sealed with the passphrase, but no gzip or past the limit: made by hand, not exported.
		return { error: 'not-an-export' };
	}
	const db = new DatabaseSync(':memory:');
	db.deserialize(unpacked);
	return { db };
}

// A new in-memory database holding only the exported columns: pages and the index never get copied,
// the file itself is never changed, and the plain tokens never reach a disk.
function realStateCopy(db: DatabaseSync, migrations: Migration[]): DatabaseSync {
	const copy = new DatabaseSync(':memory:');
	migrate(copy, migrations);
	for (const table of EXPORTED_TABLES) copyColumns(db, copy, table, EXPORTED_COLUMNS[table]);
	return copy;
}

function copyColumns(from: DatabaseSync, to: DatabaseSync, table: string, columns: string[]) {
	const list = columns.join(', ');
	// Replaces a row the migrations created, such as the settings, with the exported one.
	const insert = to.prepare(
		`INSERT OR REPLACE INTO ${table} (${list}) VALUES (${columns.map(() => '?').join(', ')})`
	);
	for (const row of from.prepare(`SELECT ${list} FROM ${table}`).iterate()) {
		insert.run(...columns.map((column) => row[column] as SQLInputValue));
	}
}

function decryptTokens(db: DatabaseSync, tokenKey: Buffer): string[] {
	const rows = db
		.prepare('SELECT id, slug, encrypted_token FROM sources WHERE encrypted_token IS NOT NULL')
		.all() as { id: number; slug: string; encrypted_token: string }[];
	// Inside an export the column holds the token in plain text; an import encrypts it again.
	const update = db.prepare('UPDATE sources SET encrypted_token = ? WHERE id = ?');
	const unreadable: string[] = [];
	for (const row of rows) {
		try {
			update.run(decryptSecret(row.encrypted_token, tokenKey), row.id);
		} catch {
			unreadable.push(row.slug);
		}
	}
	return unreadable;
}

async function encrypt(content: Buffer, passphrase: string): Promise<Buffer> {
	const salt = randomBytes(SALT_BYTES);
	const iv = randomBytes(IV_BYTES);
	const headerBytes = Buffer.from(
		JSON.stringify({
			format: FORMAT,
			version: FORMAT_VERSION,
			salt: salt.toString('base64'),
			iv: iv.toString('base64')
		})
	);
	const key = await scryptAsync(passphrase, salt, KEY_BYTES, SCRYPT);
	const cipher = createCipheriv('aes-256-gcm', key, iv);
	cipher.setAAD(headerBytes);
	const ciphertext = Buffer.concat([cipher.update(content), cipher.final()]);
	return Buffer.concat([headerBytes, Buffer.from('\n'), ciphertext, cipher.getAuthTag()]);
}

// The format and its version come first: a newer version may lay out the rest differently.
function parseHeader(
	text: string
): { salt: Buffer; iv: Buffer } | { error: 'not-an-export' | 'newer-format' } {
	let header: unknown;
	try {
		header = JSON.parse(text);
	} catch {
		return { error: 'not-an-export' };
	}
	if (typeof header !== 'object' || header === null) return { error: 'not-an-export' };
	const { format, version, salt, iv } = header as Record<string, unknown>;
	if (format !== FORMAT || !Number.isInteger(version) || (version as number) < 1) {
		return { error: 'not-an-export' };
	}
	if ((version as number) > FORMAT_VERSION) return { error: 'newer-format' };
	const saltBytes = Buffer.from(typeof salt === 'string' ? salt : '', 'base64');
	const ivBytes = Buffer.from(typeof iv === 'string' ? iv : '', 'base64');
	if (saltBytes.length !== SALT_BYTES || ivBytes.length !== IV_BYTES) {
		return { error: 'not-an-export' };
	}
	return { salt: saltBytes, iv: ivBytes };
}
