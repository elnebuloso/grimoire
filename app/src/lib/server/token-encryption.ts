import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;

/**
 * Reads the value of `TOKEN_ENCRYPTION_KEY`: 32 bytes, base64-encoded.
 * Throws without repeating the value, so it cannot end up in a log.
 */
export function parseEncryptionKey(value: string | undefined): Buffer {
	if (!value) throw new Error('required: 32 random bytes, base64, e.g. `openssl rand -base64 32`');
	const key = Buffer.from(value, 'base64');
	if (key.length !== KEY_BYTES || key.toString('base64') !== value.trim()) {
		throw new Error('must be 32 bytes, base64-encoded, e.g. `openssl rand -base64 32`');
	}
	return key;
}

/** Encrypts a source access token for storage: base64 of IV, authentication tag and ciphertext. */
export function encryptToken(token: string, key: Buffer): string {
	const iv = randomBytes(IV_BYTES);
	const cipher = createCipheriv(ALGORITHM, key, iv);
	const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
	return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64');
}

/**
 * Decrypts a token stored by `encryptToken`. Throws when the key is not the one it was encrypted
 * with or the stored value was changed; the error names neither the key nor the token.
 */
export function decryptToken(stored: string, key: Buffer): string {
	const data = Buffer.from(stored, 'base64');
	try {
		const decipher = createDecipheriv(ALGORITHM, key, data.subarray(0, IV_BYTES));
		decipher.setAuthTag(data.subarray(IV_BYTES, IV_BYTES + TAG_BYTES));
		return Buffer.concat([
			decipher.update(data.subarray(IV_BYTES + TAG_BYTES)),
			decipher.final()
		]).toString('utf8');
	} catch {
		throw new Error(
			'access token cannot be decrypted: TOKEN_ENCRYPTION_KEY differs from the key it was stored with, or the stored value is damaged'
		);
	}
}
