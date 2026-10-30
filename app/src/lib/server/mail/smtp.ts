import { createTransport } from 'nodemailer';
import { log } from '../log.js';

export interface SmtpSettings {
	host: string;
	port: number;
	user: string;
	password: string;
	from: string;
}

export interface Mail {
	to: string;
	subject: string;
	text: string;
}

export interface Mailer {
	/** Whether the SMTP server accepted the mail; a failure is logged, never thrown. */
	send(mail: Mail): Promise<boolean>;
}

export function parseSmtpPort(value: string | undefined): number {
	const port = Number(value || '587');
	if (!Number.isInteger(port) || port < 1 || port > 65535) {
		throw new Error(`SMTP_PORT must be a port number, got "${value}"`);
	}
	return port;
}

/** Sends through the SMTP server of `settings`; undefined while no host is set. */
export function createMailer(settings: SmtpSettings): Mailer | undefined {
	if (!settings.host) return undefined;
	if (!settings.from) throw new Error('SMTP_FROM is required when SMTP_HOST is set');
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
				log.error({ err: error }, `Sending mail to ${mail.to} failed`);
				return false;
			}
		}
	};
}
