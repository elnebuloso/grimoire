import { describe, it, expect, beforeEach, vi } from 'vitest';
import { captureLog } from '../capture-log';
import { createMailer, parseBaseUrl, parseSmtpPort, type SmtpSettings } from './smtp';

// No SMTP server in a test: the transport is replaced, what grimoire hands it is checked.
const sendMail = vi.hoisted(() => vi.fn());
const createTransport = vi.hoisted(() => vi.fn(() => ({ sendMail })));
vi.mock('nodemailer', () => ({ createTransport }));

const SETTINGS: SmtpSettings = {
	host: 'smtp.example.com',
	port: 587,
	user: 'grimoire',
	password: 'smtp-secret',
	from: 'grimoire <grimoire@example.com>',
	baseUrl: 'https://grimoire.example.com'
};
const MAIL = { to: 'admin@example.com', subject: 'Hello', text: 'Body' };

beforeEach(() => {
	sendMail.mockReset();
	createTransport.mockClear();
});

describe('createMailer', () => {
	it('offers no mailer without a host', () => {
		expect(createMailer({ ...SETTINGS, host: '' })).toBeUndefined();
		expect(createTransport).not.toHaveBeenCalled();
	});

	it('refuses a host without a sender address or base URL', () => {
		expect(() => createMailer({ ...SETTINGS, from: '' })).toThrow(/SMTP_FROM/);
		expect(() => createMailer({ ...SETTINGS, baseUrl: '' })).toThrow(/BASE_URL/);
	});

	it('links to the configured base URL', () => {
		expect(createMailer(SETTINGS)!.link('/login/reset/abc')).toBe(
			'https://grimoire.example.com/login/reset/abc'
		);
	});

	it('sends through the configured server from the sender address', async () => {
		sendMail.mockResolvedValue({});

		expect(await createMailer(SETTINGS)!.send(MAIL)).toBe(true);
		expect(createTransport).toHaveBeenCalledWith({
			host: 'smtp.example.com',
			port: 587,
			secure: false,
			auth: { user: 'grimoire', pass: 'smtp-secret' }
		});
		expect(sendMail).toHaveBeenCalledWith({ from: 'grimoire <grimoire@example.com>', ...MAIL });
	});

	it('uses TLS from the start on port 465 and logs in only with a user', () => {
		createMailer({ ...SETTINGS, port: 465, user: '', password: '' });

		expect(createTransport).toHaveBeenCalledWith(
			expect.objectContaining({ port: 465, secure: true, auth: undefined })
		);
	});

	it('reports a failed send and logs it without the password', async () => {
		const log = captureLog();
		sendMail.mockRejectedValue(new Error('Invalid login: 535 Authentication failed'));

		expect(await createMailer(SETTINGS)!.send(MAIL)).toBe(false);
		expect(log.messages()).toEqual(['Sending mail to admin@example.com failed']);
		expect(log.text()).toContain('535 Authentication failed');
		expect(log.text()).not.toContain('smtp-secret');
	});
});

describe('parseSmtpPort', () => {
	it('defaults to 587 and rejects what is not a port', () => {
		expect(parseSmtpPort(undefined)).toBe(587);
		expect(parseSmtpPort('1025')).toBe(1025);
		for (const value of ['0', '65536', 'smtp', '25.5']) {
			expect(() => parseSmtpPort(value)).toThrow(/SMTP_PORT/);
		}
	});
});

describe('parseBaseUrl', () => {
	it('keeps an origin and rejects anything else', () => {
		expect(parseBaseUrl(undefined)).toBe('');
		expect(parseBaseUrl('https://grimoire.example.com/')).toBe('https://grimoire.example.com');
		expect(parseBaseUrl('http://localhost:5173')).toBe('http://localhost:5173');
		for (const value of [
			'grimoire.example.com',
			'ftp://grimoire.example.com',
			'https://grimoire.example.com/docs',
			'https://grimoire.example.com/?a=1'
		]) {
			expect(() => parseBaseUrl(value)).toThrow(/BASE_URL/);
		}
	});
});
