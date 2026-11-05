import { describe, it, expect } from 'vitest';
import { parseOidcProviders } from './config';

const BASE_URL = 'https://grimoire.example.com';
const GITLAB = {
	OIDC_GITLAB_ISSUER: 'https://gitlab.example.com',
	OIDC_GITLAB_CLIENT_ID: 'grimoire',
	OIDC_GITLAB_CLIENT_SECRET: 'gloas-secret'
};

describe('parseOidcProviders', () => {
	it('configures nothing without providers', () => {
		expect(parseOidcProviders('', GITLAB, '')).toEqual([]);
		expect(parseOidcProviders(' , ', GITLAB, '')).toEqual([]);
	});

	it('reads every setting of a provider, with defaults for the optional ones', () => {
		const [gitlab, entra] = parseOidcProviders(
			'gitlab, entra',
			{
				...GITLAB,
				OIDC_ENTRA_ISSUER:
					'https://login.microsoftonline.com/7f1d3a52-9b1e-4c8a-a6f0-2d5e8b9c1a44/v2.0',
				OIDC_ENTRA_CLIENT_ID: '0b8f6c1e-3a2d-4e9f-8b7a-5c4d3e2f1a0b',
				OIDC_ENTRA_CLIENT_SECRET: 'entra-secret',
				OIDC_ENTRA_LABEL: 'Microsoft',
				OIDC_ENTRA_ALLOWED_DOMAINS: 'Example.com, partner.example.org',
				OIDC_ENTRA_REQUIRED_CLAIMS: 'tid=7f1d3a52-9b1e-4c8a-a6f0-2d5e8b9c1a44 acct=0'
			},
			BASE_URL
		);

		expect(gitlab).toEqual({
			key: 'gitlab',
			issuer: 'https://gitlab.example.com',
			clientId: 'grimoire',
			clientSecret: 'gloas-secret',
			label: 'gitlab',
			allowedDomains: [],
			requiredClaims: [],
			redirectUri: 'https://grimoire.example.com/auth/oidc/gitlab/callback'
		});
		expect(entra).toMatchObject({
			label: 'Microsoft',
			allowedDomains: ['example.com', 'partner.example.org'],
			requiredClaims: [
				['tid', '7f1d3a52-9b1e-4c8a-a6f0-2d5e8b9c1a44'],
				['acct', '0']
			]
		});
	});

	it('allows every domain only with an explicit *', () => {
		const [provider] = parseOidcProviders(
			'gitlab',
			{ ...GITLAB, OIDC_GITLAB_ALLOWED_DOMAINS: 'example.com,*' },
			BASE_URL
		);

		expect(provider.allowedDomains).toBe('*');
	});

	it('keeps the issuer as written, since ID tokens must match it exactly', () => {
		const [provider] = parseOidcProviders(
			'gitlab',
			{ ...GITLAB, OIDC_GITLAB_ISSUER: 'https://gitlab.example.com/' },
			BASE_URL
		);

		expect(provider.issuer).toBe('https://gitlab.example.com/');
	});

	it.each([
		['BASE_URL is required', 'gitlab', GITLAB, ''],
		['"GitLab" must be lowercase', 'GitLab', GITLAB, BASE_URL],
		['OIDC_GITLAB_ISSUER is required', 'gitlab', { ...GITLAB, OIDC_GITLAB_ISSUER: ' ' }, BASE_URL],
		[
			'OIDC_GITLAB_CLIENT_ID is required',
			'gitlab',
			{ ...GITLAB, OIDC_GITLAB_CLIENT_ID: undefined },
			BASE_URL
		],
		[
			'OIDC_GITLAB_CLIENT_SECRET is required',
			'gitlab',
			{ ...GITLAB, OIDC_GITLAB_CLIENT_SECRET: '' },
			BASE_URL
		],
		[
			'must be an https URL',
			'gitlab',
			{ ...GITLAB, OIDC_GITLAB_ISSUER: 'http://gitlab.example.com' },
			BASE_URL
		],
		[
			'must be an https URL',
			'gitlab',
			{ ...GITLAB, OIDC_GITLAB_ISSUER: 'gitlab.example.com' },
			BASE_URL
		],
		[
			'"hd" must be name=value',
			'gitlab',
			{ ...GITLAB, OIDC_GITLAB_REQUIRED_CLAIMS: 'hd' },
			BASE_URL
		],
		[
			'"hd=a=b" must be name=value',
			'gitlab',
			{ ...GITLAB, OIDC_GITLAB_REQUIRED_CLAIMS: 'hd=a=b' },
			BASE_URL
		],
		[
			'names the claim hd twice',
			'gitlab',
			{ ...GITLAB, OIDC_GITLAB_REQUIRED_CLAIMS: 'hd=a hd=b' },
			BASE_URL
		],
		[
			'gitlab and gitlabcom share an issuer',
			'gitlab gitlabcom',
			{
				...GITLAB,
				OIDC_GITLABCOM_ISSUER: GITLAB.OIDC_GITLAB_ISSUER,
				OIDC_GITLABCOM_CLIENT_ID: 'other',
				OIDC_GITLABCOM_CLIENT_SECRET: 'other-secret'
			},
			BASE_URL
		]
	])('refuses a configuration that cannot work: %s', (message, keys, env, baseUrl) => {
		expect(() => parseOidcProviders(keys, env, baseUrl)).toThrow(message);
	});

	it('accepts http only for an issuer on this machine', () => {
		const [provider] = parseOidcProviders(
			'mock',
			{
				OIDC_MOCK_ISSUER: 'http://localhost:4580/gitlab',
				OIDC_MOCK_CLIENT_ID: 'grimoire',
				OIDC_MOCK_CLIENT_SECRET: 'mock-secret'
			},
			'http://localhost:4173'
		);

		expect(provider.issuer).toBe('http://localhost:4580/gitlab');
	});

	it('names no secret in an error', () => {
		expect(() =>
			parseOidcProviders('gitlab', { ...GITLAB, OIDC_GITLAB_ISSUER: 'ftp://x' }, BASE_URL)
		).not.toThrow(/gloas-secret/);
	});
});
