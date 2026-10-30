import { defineEnvVars } from '@sveltejs/kit/env';
import { building } from '$app/env';
import { parseEncryptionKey } from '#lib/server/token-encryption.js';
import { parseSchedule } from '#lib/server/sync/schedule.js';
import { parseAllowedOrigins } from '#lib/server/sync/url-include.js';
import { parseLogFormat, parseLogLevel } from '#lib/server/log.js';
import { parseTimeZone } from '#lib/time-zone.js';
import { parseBaseUrl, parseSmtpPort } from '#lib/server/mail/smtp.js';

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
	INCLUDE_URL_ALLOW: {
		description:
			'Origins pages may include files from by URL (`url_download` of pymdownx.snippets), `https://` only, separated by commas; empty: none',
		schema: parseAllowedOrigins
	},
	LOG_FORMAT: {
		description:
			'`ecs` writes one JSON object per line in the Elastic Common Schema, `pretty` readable text for local development; default `ecs`',
		schema: parseLogFormat
	},
	SMTP_HOST: {
		description:
			'SMTP server grimoire sends mail through, such as password reset links; empty: no mail is sent and the functions that need it are not offered',
		schema: (value) => value ?? ''
	},
	SMTP_PORT: {
		description:
			'Port of the SMTP server; 465 uses TLS from the start, others STARTTLS; default 587',
		schema: parseSmtpPort
	},
	SMTP_ALLOW_PLAINTEXT: {
		description:
			'With `true`, send without TLS when the SMTP server offers no STARTTLS, such as a local mail catcher; otherwise such a server gets no mail',
		schema: (value) => value === 'true'
	},
	SMTP_USER: {
		description: 'User name at the SMTP server; empty: send without logging in',
		schema: (value) => value ?? ''
	},
	SMTP_PASSWORD: {
		description: 'Password of `SMTP_USER`',
		schema: (value) => value ?? ''
	},
	SMTP_FROM: {
		description:
			'Sender address of the mails, such as `grimoire <grimoire@example.com>`; required with `SMTP_HOST`',
		schema: (value) => value ?? ''
	},
	BASE_URL: {
		description:
			'Where grimoire is reached, such as `https://grimoire.example.com`; absolute links (mails, start page, `llms.txt`) point there, else to the address of the request; required with `SMTP_HOST`',
		schema: parseBaseUrl
	},
	LOG_LEVEL: {
		description: 'Lowest level that is written: `error`, `warn`, `info` or `debug`; default `info`',
		schema: parseLogLevel
	}
});
