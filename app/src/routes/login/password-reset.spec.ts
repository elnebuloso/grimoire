import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DatabaseSync } from 'node:sqlite';
import { isHttpError } from '@sveltejs/kit';
import { openDatabase } from '#lib/server/db/schema.js';
import type { Mailer } from '#lib/server/mail/index.js';

let db: DatabaseSync;
let mail: Mailer | undefined;
const send = vi.fn(async () => true);

vi.mock('#lib/server/db/index.js', () => ({ database: () => db }));
// The SMTP server is outside the test; whether a mailer exists is what the pages depend on.
vi.mock('#lib/server/mail/index.js', () => ({ mailer: () => mail }));

const EMAIL = 'admin@example.com';
const PASSWORD = 'correct horse battery';

// Request counts live in module state; every test starts with fresh modules.
async function load() {
	vi.resetModules();
	return {
		auth: await import('#lib/server/admin/auth.js'),
		login: await import('./+page.server'),
		forgot: await import('./forgot/+page.server'),
		reset: await import('./reset/[token]/+page.server')
	};
}
let pages: Awaited<ReturnType<typeof load>>;

function event(path: string, fields?: Record<string, string>, params: Record<string, string> = {}) {
	return {
		request: new Request(`https://grimoire.example${path}`, {
			method: fields ? 'POST' : 'GET',
			body: fields && new URLSearchParams(fields)
		}),
		params,
		getClientAddress: () => 'client',
		setHeaders: vi.fn()
	} as never;
}

async function result(run: () => unknown): Promise<unknown> {
	try {
		return await run();
	} catch (thrown) {
		return thrown;
	}
}

function linkToken(): string {
	const [[{ text }]] = send.mock.calls as unknown as [[{ text: string }]];
	return text.match(/\/login\/reset\/([\w-]+)/)![1];
}

beforeEach(async () => {
	db = openDatabase(':memory:');
	send.mockClear();
	mail = { send, link: (path) => `https://grimoire.example.com${path}` };
	pages = await load();
	await pages.auth.createUser(db, { email: EMAIL, password: PASSWORD, roles: ['admin'] });
});

describe('without SMTP', () => {
	beforeEach(() => {
		mail = undefined;
	});

	it('offers no reset: no link on the login page, 404 for its pages', async () => {
		expect(await pages.login.load(event('/login'))).toEqual({ resetByMail: false });
		for (const run of [
			() => pages.forgot.load(event('/login/forgot')),
			() => pages.forgot.actions.default(event('/login/forgot', { email: EMAIL })),
			() => pages.reset.load(event('/login/reset/x', undefined, { token: 'x' })),
			() =>
				pages.reset.actions.default(event('/login/reset/x', { password: PASSWORD }, { token: 'x' }))
		]) {
			const thrown = await result(run);
			expect(isHttpError(thrown) && thrown.status).toBe(404);
		}
	});
});

describe('with SMTP', () => {
	it('links to the reset from the login page', async () => {
		expect(await pages.login.load(event('/login'))).toEqual({ resetByMail: true });
	});

	it('answers known and unknown addresses alike and mails a link only for a known one', async () => {
		const unknown = await pages.forgot.actions.default(
			event('/login/forgot', { email: 'nobody@example.com' })
		);
		expect(send).not.toHaveBeenCalled();

		const known = await pages.forgot.actions.default(event('/login/forgot', { email: EMAIL }));

		expect(known).toEqual(unknown);
		expect(send).toHaveBeenCalledWith({
			to: EMAIL,
			subject: 'Set a new password for grimoire',
			text: expect.stringContaining('https://grimoire.example.com/login/reset/')
		});
	});

	it('sets the new password through the mailed link and keeps it from leaking as referrer', async () => {
		await pages.forgot.actions.default(event('/login/forgot', { email: EMAIL }));
		const token = linkToken();
		const page = event(`/login/reset/${token}`, undefined, { token });

		expect(await pages.reset.load(page)).toEqual({ valid: true });
		expect((page as { setHeaders: ReturnType<typeof vi.fn> }).setHeaders).toHaveBeenCalledWith({
			'referrer-policy': 'same-origin'
		});
		expect(
			await pages.reset.actions.default(
				event(`/login/reset/${token}`, { password: 'staple battery horse' }, { token })
			)
		).toEqual({ done: true });
		expect(await pages.reset.load(event(`/login/reset/${token}`, undefined, { token }))).toEqual({
			valid: false
		});
	});

	it('marks a used or unknown link so the page offers a new one', async () => {
		expect(
			await pages.reset.actions.default(
				event('/login/reset/guess', { password: 'staple battery horse' }, { token: 'guess' })
			)
		).toMatchObject({ status: 400, data: { linkInvalid: true } });
	});

	it('answers a client that asks too often with 429', async () => {
		for (let request = 0; request < 5; request++) {
			await pages.forgot.actions.default(event('/login/forgot', { email: EMAIL }));
		}

		expect(
			await pages.forgot.actions.default(event('/login/forgot', { email: EMAIL }))
		).toMatchObject({
			status: 429,
			data: { error: 'Too many requests for a new password. Try again later.' }
		});
	});
});
