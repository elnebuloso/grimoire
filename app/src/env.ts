import { defineEnvVars } from '@sveltejs/kit/env';
import { building } from '$app/env';

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
	}
});
