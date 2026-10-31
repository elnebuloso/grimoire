import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_BYTES = 32;
const IV_BYTES = 12;
const TAG_BYTES = 16;

/** One key per purpose, each derived from `ENCRYPTION_KEY`. */
export interface EncryptionKeys {
	/** Git access tokens stored with their source. */
	sourceTokens: Buffer;
	/** Secrets a form carries between requests in a hidden field. */
	formSecrets: Buffer;
}

/**
 * Reads the value of `ENCRYPTION_KEY`, 32 bytes base64-encoded, and derives the key of each
 * purpose from it. Throws without repeating the value, so it cannot end up in a log.
 */
export function parseEncryptionKey(value: string | undefined): EncryptionKeys {
	if (!value) throw new Error('required: 32 random bytes, base64, e.g. `openssl rand -base64 32`');
	const key = Buffer.from(value, 'base64');
	if (key.length !== KEY_BYTES || key.toString('base64') !== value.trim()) {
		throw new Error('must be 32 bytes, base64-encoded, e.g. `openssl rand -base64 32`');
	}
	return deriveKeys(key);
}

// A key of its own per purpose, so a value encrypted for one is never accepted by another. A label
// stays with its purpose for good: changing it makes every value stored under it unreadable.
export function deriveKeys(instanceKey: Buffer): EncryptionKeys {
	const derive = (label: string) =>
		Buffer.from(hkdfSync('sha256', instanceKey, Buffer.alloc(0), label, KEY_BYTES));
	return { sourceTokens: derive('source-tokens'), formSecrets: derive('form-secrets') };
}

/** Encrypts a secret under the key of its purpose: base64 of IV, authentication tag and ciphertext. */
export function encryptSecret(secret: string, key: Buffer): string {
	const iv = randomBytes(IV_BYTES);
	const cipher = createCipheriv(ALGORITHM, key, iv);
	const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
	return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64');
}

/**
 * Decrypts a value from `encryptSecret`. Throws when the key is not the one it was encrypted with
 * or the value was changed; the error names neither key nor secret, so the caller says which failed.
 */
export function decryptSecret(stored: string, key: Buffer): string {
	const data = Buffer.from(stored, 'base64');
	try {
		const decipher = createDecipheriv(ALGORITHM, key, data.subarray(0, IV_BYTES));
		decipher.setAuthTag(data.subarray(IV_BYTES, IV_BYTES + TAG_BYTES));
		return Buffer.concat([
			decipher.update(data.subarray(IV_BYTES + TAG_BYTES)),
			decipher.final()
		]).toString('utf8');
	} catch {
		throw new Error('cannot be decrypted with the current key');
	}
}
