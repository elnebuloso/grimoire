import { describe, it, expect } from 'vitest';
import { decryptSecret, deriveKeys, encryptSecret, parseEncryptionKey } from './secret-encryption';

const key = Buffer.alloc(32, 1);
const otherKey = Buffer.alloc(32, 2);
const token = 'glpat-secret-token';

describe('secret encryption', () => {
	it('decrypts what it encrypted, and the stored value does not contain the token', () => {
		const stored = encryptSecret(token, key);
		expect(stored).not.toContain(token);
		expect(Buffer.from(stored, 'base64').toString('utf8')).not.toContain(token);
		expect(decryptSecret(stored, key)).toBe(token);
	});

	it('stores the same token differently each time', () => {
		expect(encryptSecret(token, key)).not.toBe(encryptSecret(token, key));
	});

	it('refuses a wrong key without revealing key or token', () => {
		const error = catchError(() => decryptSecret(encryptSecret(token, key), otherKey));
		expect(error.message).toBe('cannot be decrypted with the current key');
		expect(error.message).not.toContain(token);
		expect(error.message).not.toContain(otherKey.toString('base64'));
	});

	it('refuses a tampered value', () => {
		const data = Buffer.from(encryptSecret(token, key), 'base64');
		data[data.length - 1] ^= 1;
		expect(() => decryptSecret(data.toString('base64'), key)).toThrow(
			'cannot be decrypted with the current key'
		);
	});

	it('refuses a value too short to hold IV and tag', () => {
		expect(() => decryptSecret('c2hvcnQ=', key)).toThrow(
			'cannot be decrypted with the current key'
		);
	});
});

describe('parseEncryptionKey', () => {
	it('accepts 32 bytes in base64 and derives the key of each purpose from them', () => {
		expect(parseEncryptionKey(key.toString('base64'))).toEqual(deriveKeys(key));
	});

	it.each([
		['missing', undefined, /required/],
		['too short', Buffer.alloc(16).toString('base64'), /must be 32 bytes/],
		['not base64', 'x'.repeat(44), /must be 32 bytes/]
	])('rejects a %s key without repeating it', (_, value, message) => {
		const error = catchError(() => parseEncryptionKey(value));
		expect(error.message).toMatch(message);
		if (value) expect(error.message).not.toContain(value);
	});
});

describe('deriveKeys', () => {
	it('derives the same keys from the same instance key, so stored values survive a restart', () => {
		expect(deriveKeys(Buffer.from(key))).toEqual(deriveKeys(key));
	});

	it('gives every purpose a key of its own, none of them the instance key', () => {
		const { sourceTokens, formSecrets } = deriveKeys(key);
		expect(new Set([sourceTokens, formSecrets, key].map((k) => k.toString('hex'))).size).toBe(3);
	});

	it('refuses a value encrypted for one purpose under the key of another', () => {
		const { sourceTokens, formSecrets } = deriveKeys(key);
		expect(() => decryptSecret(encryptSecret(token, sourceTokens), formSecrets)).toThrow(
			'cannot be decrypted with the current key'
		);
	});
});

function catchError(action: () => unknown): Error {
	try {
		action();
	} catch (error) {
		return error as Error;
	}
	throw new Error('expected an error');
}
