import { describe, it, expect } from 'vitest';
import { decryptToken, encryptToken, parseEncryptionKey } from './token-encryption';

const key = Buffer.alloc(32, 1);
const otherKey = Buffer.alloc(32, 2);
const token = 'glpat-secret-token';

describe('token encryption', () => {
	it('decrypts what it encrypted, and the stored value does not contain the token', () => {
		const stored = encryptToken(token, key);
		expect(stored).not.toContain(token);
		expect(Buffer.from(stored, 'base64').toString('utf8')).not.toContain(token);
		expect(decryptToken(stored, key)).toBe(token);
	});

	it('stores the same token differently each time', () => {
		expect(encryptToken(token, key)).not.toBe(encryptToken(token, key));
	});

	it('refuses a wrong key without revealing key or token', () => {
		const error = catchError(() => decryptToken(encryptToken(token, key), otherKey));
		expect(error.message).toMatch(/TOKEN_ENCRYPTION_KEY differs/);
		expect(error.message).not.toContain(token);
		expect(error.message).not.toContain(otherKey.toString('base64'));
	});

	it('refuses a tampered value', () => {
		const data = Buffer.from(encryptToken(token, key), 'base64');
		data[data.length - 1] ^= 1;
		expect(() => decryptToken(data.toString('base64'), key)).toThrow(/stored value is damaged/);
	});

	it('refuses a value too short to hold IV and tag', () => {
		expect(() => decryptToken('c2hvcnQ=', key)).toThrow(/stored value is damaged/);
	});
});

describe('parseEncryptionKey', () => {
	it('accepts 32 bytes in base64', () => {
		expect(parseEncryptionKey(key.toString('base64'))).toEqual(key);
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

function catchError(action: () => unknown): Error {
	try {
		action();
	} catch (error) {
		return error as Error;
	}
	throw new Error('expected an error');
}
