import { createTransport } from 'nodemailer';
import { log } from '../log.js';

export interface SmtpSettings {
	host: string;
	port: number;
	user: string;
	password: string;
	from: string;
	/** Where grimoire is reached, such as `https://grimoire.example.com`; links in mails point there. */
	baseUrl: string;
}

export interface Mail {
	to: string;
	subject: string;
	text: string;
}

export interface Mailer {
	/** Whether the SMTP server accepted the mail; a failure is logged, never thrown. */
	send(mail: Mail): Promise<boolean>;
	/** The address of `path` on this instance, for a link in a mail. */
	link(path: string): string;
}

export function parseSmtpPort(value: string | undefined): number {
	const port = Number(value || '587');
	if (!Number.isInteger(port) || port < 1 || port > 65535) {
		throw new Error(`SMTP_PORT must be a port number, got "${value}"`);
	}
	return port;
}

export function parseBaseUrl(value: string | undefined): string {
	if (!value) return '';
	const url = URL.parse(value);
	if (!url || !['https:', 'http:'].includes(url.protocol) || url.pathname !== '/' || url.search) {
		throw new Error(
			`BASE_URL must be an origin such as https://grimoire.example.com, got "${value}"`
		);
	}
	return url.origin;
}

/** Sends through the SMTP server of `settings`; undefined while no host is set. */
export function createMailer(settings: SmtpSettings): Mailer | undefined {
	if (!settings.host) return undefined;
	if (!settings.from) throw new Error('SMTP_FROM is required when SMTP_HOST is set');
	// Links in mails cannot use the origin of the request: its Host header is the sender's choice,
	// and a reset link pointing to another host would hand the token to whoever runs it.
	if (!settings.baseUrl) throw new Error('BASE_URL is required when SMTP_HOST is set');
	const transport = createTransport({
		host: settings.host,
		port: settings.port,
		// Port 465 speaks TLS from the start; on the others nodemailer upgrades with STARTTLS
		// when the server offers it.
		secure: settings.port === 465,
		auth: settings.user ? { user: settings.user, pass: settings.password } : undefined
	});
	return {
		async send(mail) {
			try {
				await transport.sendMail({ from: settings.from, ...mail });
				return true;
			} catch (error) {
				// Without the address: logs are shipped elsewhere, and SMTP errors such as a rejected
				// recipient quote it.
				const { message, code } = error as Error & { code?: string };
				const reason = message.replace(new RegExp(RegExp.escape(mail.to), 'gi'), '<recipient>');
				log.error({ err: { message: reason, code } }, `Sending mail "${mail.subject}" failed`);
				return false;
			}
		},
		link(path) {
			return new URL(path, settings.baseUrl).href;
		}
	};
}
