import { describe, it, expect } from 'vitest';
import { decideLogin, type KnownAccounts } from './decision';

const ISSUER = 'https://gitlab.example.com';
const PROVIDER = { allowedDomains: ['example.com'], requiredClaims: [] as [string, string][] };
const NEW_USER = { iss: ISSUER, sub: '42', email: 'Ada@Example.com', email_verified: true };

function accounts(linked: Record<string, number> = {}, emails: string[] = []): KnownAccounts {
	return {
		linkedUser: (issuer, subject) => linked[`${issuer} ${subject}`],
		accountExists: (email) => emails.includes(email)
	};
}

describe('decideLogin', () => {
	it('logs a linked identity in, whatever email address the provider reports now', () => {
		const linked = accounts({ [`${ISSUER} 42`]: 7 }, ['ada@example.com']);

		expect(decideLogin({ ...NEW_USER, email: 'other@elsewhere.org' }, PROVIDER, linked)).toEqual({
			action: 'login',
			userId: 7
		});
		expect(decideLogin({ iss: ISSUER, sub: '42' }, PROVIDER, linked)).toEqual({
			action: 'login',
			userId: 7
		});
	});

	it('does not take the same subject at another issuer for the linked identity', () => {
		const linked = accounts({ [`https://gitlab.com 42`]: 7 });

		expect(decideLogin(NEW_USER, PROVIDER, linked)).toEqual({
			action: 'create',
			email: 'ada@example.com',
			identity: { issuer: ISSUER, subject: '42' }
		});
	});

	it('never reaches an existing account through its email address', () => {
		expect(decideLogin(NEW_USER, PROVIDER, accounts({}, ['ada@example.com']))).toEqual({
			action: 'refuse',
			reason: 'oidc-email-taken'
		});
	});

	it.each([
		['unverified', { ...NEW_USER, email_verified: false }, PROVIDER],
		['outside the allowed domains', NEW_USER, { ...PROVIDER, allowedDomains: ['example.org'] }]
	])('does not tell an address %s whether it has an account', (_case, claims, provider) => {
		expect(decideLogin(claims, provider, accounts({}, ['ada@example.com']))).toEqual({
			action: 'refuse',
			reason: 'oidc-not-allowed'
		});
	});

	it('creates an account for a verified address in an allowed domain', () => {
		expect(decideLogin(NEW_USER, PROVIDER, accounts())).toEqual({
			action: 'create',
			email: 'ada@example.com',
			identity: { issuer: ISSUER, subject: '42' }
		});
		expect(
			decideLogin({ ...NEW_USER, email_verified: 'true' }, PROVIDER, accounts())
		).toMatchObject({ action: 'create' });
		expect(
			decideLogin({ ...NEW_USER, email_verified: undefined, xms_edov: true }, PROVIDER, accounts())
		).toMatchObject({ action: 'create' });
		expect(
			decideLogin(
				{ ...NEW_USER, email: 'bob@elsewhere.org' },
				{ ...PROVIDER, allowedDomains: '*' },
				accounts()
			)
		).toMatchObject({ action: 'create' });
	});

	it.each([
		['unverified', { ...NEW_USER, email_verified: false }, PROVIDER],
		['verified only as text other than true', { ...NEW_USER, email_verified: 'yes' }, PROVIDER],
		['without a verified flag', { ...NEW_USER, email_verified: undefined }, PROVIDER],
		[
			'in a domain that only ends like an allowed one',
			{ ...NEW_USER, email: 'ada@evilexample.com' },
			PROVIDER
		],
		['in a subdomain of an allowed one', { ...NEW_USER, email: 'ada@mail.example.com' }, PROVIDER],
		['with no domain allowed', NEW_USER, { ...PROVIDER, allowedDomains: [] }]
	])('creates no account for an address %s', (_case, claims, provider) => {
		expect(decideLogin(claims, provider, accounts())).toEqual({
			action: 'refuse',
			reason: 'oidc-not-allowed'
		});
	});

	it('creates no account without an email address', () => {
		for (const email of [undefined, '', 'not an address', 42]) {
			expect(decideLogin({ ...NEW_USER, email }, PROVIDER, accounts())).toEqual({
				action: 'refuse',
				reason: 'oidc-no-email'
			});
		}
	});

	it('refuses every login without the required claims, a linked one too', () => {
		const provider = {
			...PROVIDER,
			requiredClaims: [
				['hd', 'example.com'],
				['acct', '0']
			] as [string, string][]
		};
		const linked = accounts({ [`${ISSUER} 42`]: 7 });

		expect(decideLogin({ ...NEW_USER, hd: 'example.com', acct: 0 }, provider, linked)).toEqual({
			action: 'login',
			userId: 7
		});
		for (const claims of [
			NEW_USER,
			{ ...NEW_USER, hd: 'example.com' },
			{ ...NEW_USER, hd: 'example.org', acct: 0 },
			{ ...NEW_USER, hd: ['example.com'], acct: 0 },
			{ ...NEW_USER, hd: { value: 'example.com' }, acct: 0 }
		]) {
			expect(decideLogin(claims, provider, linked)).toEqual({
				action: 'refuse',
				reason: 'oidc-claims'
			});
		}
	});

	it.each([
		['link', { link: 'session-hash' }, 'link'],
		['invitation', { invite: 'invitation-token' }, 'accept-invitation']
	] as const)(
		'hands the identity on to a %s, whatever account or address it has',
		(_flow, flow, action) => {
			const known = accounts({ [`${ISSUER} 42`]: 7 }, ['ada@example.com']);
			const identity = { issuer: ISSUER, subject: '42' };

			for (const claims of [
				NEW_USER,
				{ ...NEW_USER, email_verified: false },
				{ iss: ISSUER, sub: '42' }
			]) {
				expect(decideLogin(claims, PROVIDER, known, flow)).toEqual({ action, identity });
			}
		}
	);

	it.each([
		['login', {}],
		['link', { link: 'session-hash' }],
		['invitation', { invite: 'invitation-token' }]
	])('refuses a %s without the required claims', (_flow, flow) => {
		const provider = { ...PROVIDER, requiredClaims: [['hd', 'example.com']] as [string, string][] };

		expect(decideLogin(NEW_USER, provider, accounts(), flow)).toEqual({
			action: 'refuse',
			reason: 'oidc-claims'
		});
	});
});
