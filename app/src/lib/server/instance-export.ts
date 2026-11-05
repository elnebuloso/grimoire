import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { promisify } from 'node:util';
import { gunzipSync, gzipSync } from 'node:zlib';
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
 * other column holds its schema default in the export.
 */
export const EXPORTED_COLUMNS: Record<string, string[]> = {
	users: ['id', 'email', 'password_hash'],
	user_roles: ['user_id', 'role'],
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
		'visibility',
		'owner_id'
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
 * Writes the real state of `db` into an export encrypted with `passphrase`. Git tokens are
 * decrypted with `tokenKey` and stored in plain text inside it; a token that does not decrypt
 * fails the export with the slugs of its sources, so it is fixed before it is carried along.
 */
export async function writeExport(
	db: DatabaseSync,
	tokenKey: Buffer,
	passphrase: string
): Promise<{ file: Buffer } | { error: 'unreadable-tokens'; sources: string[] }> {
	const content = realStateCopy(db);
	try {
		const unreadable = decryptTokens(content, tokenKey);
		if (unreadable.length > 0) return { error: 'unreadable-tokens', sources: unreadable };
		content.exec('VACUUM');
		return { file: await encrypt(gzipSync(content.serialize()), passphrase) };
	} finally {
		content.close();
	}
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
	const db = new DatabaseSync(':memory:');
	db.deserialize(gunzipSync(content, { maxOutputLength: MAX_CONTENT_BYTES }));
	return { db };
}

// An in-memory copy of the whole database, then emptied: the file itself is never changed, and
// the plain tokens never reach a disk.
function realStateCopy(db: DatabaseSync): DatabaseSync {
	const image = db.serialize();
	// Bytes 18 and 19 mark a database in WAL mode, which an in-memory database cannot open.
	image[18] = 1;
	image[19] = 1;
	const copy = new DatabaseSync(':memory:');
	copy.deserialize(image);
	copy.exec('PRAGMA foreign_keys = OFF');
	for (const table of EMPTIED_TABLES) copy.exec(`DELETE FROM ${table}`);
	for (const table of EXPORTED_TABLES) resetToDefaults(copy, table, EXPORTED_COLUMNS[table]);
	return copy;
}

// A column not exported holds what a new row would get, so the first sync after an import starts as
// for a new source.
function resetToDefaults(db: DatabaseSync, table: string, exported: string[]) {
	const columns = db.prepare('SELECT name, dflt_value FROM pragma_table_info(?)').all(table) as {
		name: string;
		dflt_value: string | null;
	}[];
	for (const { name, dflt_value } of columns) {
		if (!exported.includes(name)) db.exec(`UPDATE ${table} SET ${name} = ${dflt_value ?? 'NULL'}`);
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
