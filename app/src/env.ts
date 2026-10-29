import { defineEnvVars } from '@sveltejs/kit/env';
import { building } from '$app/env';
import { parseEncryptionKey } from '#lib/server/token-encryption.js';
import { parseSchedule } from '#lib/server/sync/schedule.js';
import { parseLogFormat, parseLogLevel } from '#lib/server/log.js';
import { parseTimeZone } from '#lib/time-zone.js';

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
	},
	SYNC_SCHEDULE: {
		description:
			'When sources without their own schedule are checked for new commits: cron expression with five fields, in the time zone `TZ`; default every 5 minutes',
		schema: (value) => parseSchedule(value || '*/5 * * * *')
	},
	TZ: {
		description:
			'Time zone of the instance, an IANA name such as `Europe/Berlin`: schedules run and the UI shows times in it; default UTC',
		schema: parseTimeZone
	},
	LOG_FORMAT: {
		description:
			'`ecs` writes one JSON object per line in the Elastic Common Schema, `pretty` readable text for local development; default `ecs`',
		schema: parseLogFormat
	},
	LOG_LEVEL: {
		description: 'Lowest level that is written: `error`, `warn`, `info` or `debug`; default `info`',
		schema: parseLogLevel
	}
});
