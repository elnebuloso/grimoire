import { describe, it, expect } from 'vitest';
import { encryptToken } from '../token-encryption';
import { readFormSecret, SOURCE_TOKEN_FIELDS } from './form-secret';

const KEY = Buffer.alloc(32, 7);

function read(fields: Record<string, string>) {
	const data = new FormData();
	for (const [name, value] of Object.entries(fields)) data.set(name, value);
	return readFormSecret(data, KEY, SOURCE_TOKEN_FIELDS);
}

describe('readFormSecret', () => {
	it('seals a newly entered secret', () => {
		const secret = read({ token: ' glpat-new ' });

		expect(secret).toMatchObject({ value: 'glpat-new', damaged: false });
		expect(read({ encryptedToken: secret.sealed }).value).toBe('glpat-new');
	});

	it('opens the carried secret and keeps its sealed form', () => {
		const sealed = encryptToken('glpat-carried', KEY);

		expect(read({ encryptedToken: sealed })).toEqual({
			value: 'glpat-carried',
			sealed,
			remove: false,
			damaged: false
		});
	});

	it('prefers a newly entered secret over the carried one', () => {
		const sealed = encryptToken('glpat-carried', KEY);

		expect(read({ token: 'glpat-new', encryptedToken: sealed }).value).toBe('glpat-new');
	});

	it('drops the carried secret when asked to', () => {
		const sealed = encryptToken('glpat-carried', KEY);

		expect(read({ encryptedToken: sealed, removeToken: 'on' })).toEqual({
			value: '',
			sealed: '',
			remove: true,
			damaged: false
		});
	});

	it('reports a changed or foreign carried value as damaged instead of throwing', () => {
		const foreign = encryptToken('glpat-carried', Buffer.alloc(32, 8));

		expect(read({ encryptedToken: 'tampered' })).toMatchObject({ value: '', damaged: true });
		expect(read({ encryptedToken: foreign })).toMatchObject({ value: '', damaged: true });
	});
});
