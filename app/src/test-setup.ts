import { vi } from 'vitest';

// scrypt at the production cost takes about 0.4 s per hash, which turns every test that logs in
// into a slow one. Tests hash with a smaller N; r and p still come from the caller.
vi.mock('node:crypto', async (importOriginal) => {
	const crypto = await importOriginal<typeof import('node:crypto')>();
	const scrypt = (...args: Parameters<typeof crypto.scrypt>) => {
		const [password, salt, keyLength, options, callback] = args as [
			string,
			Buffer,
			number,
			import('node:crypto').ScryptOptions,
			(error: Error | null, key: Buffer) => void
		];
		crypto.scrypt(password, salt, keyLength, { ...options, N: 2 ** 10 }, callback);
	};
	return { ...crypto, default: { ...crypto, scrypt }, scrypt };
});
