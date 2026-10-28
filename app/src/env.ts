import { defineEnvVars } from '@sveltejs/kit/env';
import { building } from '$app/env';
import { parseEncryptionKey } from '#lib/server/token-encryption.js';

export const variables = defineEnvVars({
	DATABASE_PATH: {
		description: 'Path of the SQLite file; the schema is created on first start',
		// Required when the server starts, not while the image is built.
		schema: (value) => {
			if (!value && !building) throw new Error('path of the SQLite file is required');
			return value ?? '';
		}
	},
	MIGRATE_ONLY: {
		description:
			'With `true`, migrate the database and exit without serving, e.g. in an init container',
		schema: (value) => value === 'true'
	},
	TOKEN_ENCRYPTION_KEY: {
		description:
			'Key encrypting the Git access tokens of sources in the database; 32 bytes, base64',
		schema: (value) => (building ? Buffer.alloc(0) : parseEncryptionKey(value))
	}
});
