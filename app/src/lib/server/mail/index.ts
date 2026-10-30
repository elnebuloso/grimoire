import {
	BASE_URL,
	SMTP_FROM,
	SMTP_HOST,
	SMTP_PASSWORD,
	SMTP_PORT,
	SMTP_USER
} from '$app/env/private';
import { createMailer, type Mailer } from './smtp.js';

export type { Mail, Mailer } from './smtp.js';

let configured: { mailer: Mailer | undefined } | undefined;

/** The mailer of this instance; undefined when no SMTP server is configured. */
export function mailer(): Mailer | undefined {
	configured ??= {
		mailer: createMailer({
			host: SMTP_HOST,
			port: SMTP_PORT,
			user: SMTP_USER,
			password: SMTP_PASSWORD,
			from: SMTP_FROM,
			baseUrl: BASE_URL
		})
	};
	return configured.mailer;
}
