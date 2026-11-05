import { describe, it, expect, vi } from 'vitest';
import {
	checkConnection,
	ConnectionRefused,
	connectionPolicy,
	isPublicAddress,
	parseAllowedHosts,
	type ConnectionPolicy,
	type Lookup
} from './connection-policy';

const PUBLIC_ONLY: ConnectionPolicy = { allowedHosts: [], proxy: false };
const LISTED = { allowedHosts: ['gitlab.acme.example'], proxy: false };

/** DNS that answers `addresses` for every name. */
function resolvingTo(...addresses: string[]): Lookup {
	return vi.fn(async () =>
		addresses.map((address) => ({ address, family: address.includes(':') ? 6 : 4 }))
	);
}

async function refusedHost(url: string, policy = PUBLIC_ONLY, lookup = resolvingTo('8.8.8.8')) {
	try {
		await checkConnection(url, policy, lookup);
	} catch (error) {
		if (error instanceof ConnectionRefused) return error.host;
		throw error;
	}
	return undefined;
}

describe('checkConnection', () => {
	it('pins a public host to the address it resolved to, on port 443', async () => {
		expect(
			await checkConnection('https://GitLab.com/a/b.git', PUBLIC_ONLY, resolvingTo('172.65.251.78'))
		).toEqual({ url: 'https://gitlab.com/a/b.git', pin: 'gitlab.com:443:172.65.251.78' });
	});

	it('writes an IPv6 address of the pin in brackets', async () => {
		expect(
			await checkConnection('https://gitlab.com/x.git', PUBLIC_ONLY, resolvingTo('2606:4700::1'))
		).toMatchObject({ pin: 'gitlab.com:443:[2606:4700::1]' });
	});

	it.each([
		['http://gitlab.com/x.git', 'gitlab.com'],
		['ssh://git@gitlab.com/x.git', 'gitlab.com'],
		['file:///srv/x.git', ''],
		['git@gitlab.com:x.git', 'git@gitlab.com:x.git'],
		['--upload-pack=touch /tmp/x', '--upload-pack=touch /tmp/x']
	])('refuses %s: https only', async (url, host) => {
		expect(await refusedHost(url)).toBe(host);
	});

	it.each([
		['https://10.0.0.5/x.git', '10.0.0.5'],
		['https://8.8.8.8/x.git', '8.8.8.8'],
		['https://2130706433/x.git', '127.0.0.1'],
		['https://0x7f.1/x.git', '127.0.0.1'],
		['https://[::1]/x.git', '[::1]'],
		['https://[2606:4700::1]/x.git', '[2606:4700::1]'],
		['https://[::ffff:127.0.0.1]/x.git', '[::ffff:7f00:1]']
	])('refuses the IP literal %s', async (url, host) => {
		expect(await refusedHost(url)).toBe(host);
	});

	it('refuses a port other than 443, and accepts 443 written out', async () => {
		expect(await refusedHost('https://gitlab.com:8443/x.git')).toBe('gitlab.com:8443');
		expect(await refusedHost('https://gitlab.com:443/x.git')).toBeUndefined();
	});

	it.each([
		'127.0.0.1',
		'10.1.2.3',
		'172.20.0.1',
		'192.168.1.1',
		'169.254.169.254',
		'100.64.0.1',
		'0.0.0.0',
		'::1',
		'fd00::1',
		'fe80::1',
		'::ffff:10.0.0.1',
		'64:ff9b::a00:1'
	])('refuses a name that resolves to %s', async (address) => {
		expect(
			await refusedHost('https://git.example.com/x.git', PUBLIC_ONLY, resolvingTo(address))
		).toBe('git.example.com');
	});

	it('refuses a name when only one of its addresses is internal', async () => {
		expect(
			await refusedHost(
				'https://git.example.com/x.git',
				PUBLIC_ONLY,
				resolvingTo('8.8.8.8', '10.0.0.1')
			)
		).toBe('git.example.com');
	});

	it('lets a listed host through on any address and port, still https and pinned', async () => {
		expect(
			await checkConnection(
				'https://GITLAB.acme.example:8443/x.git',
				LISTED,
				resolvingTo('10.0.0.5')
			)
		).toEqual({
			url: 'https://gitlab.acme.example:8443/x.git',
			pin: 'gitlab.acme.example:8443:10.0.0.5'
		});
		expect(await refusedHost('http://gitlab.acme.example/x.git', LISTED)).toBe(
			'gitlab.acme.example'
		);
	});

	it('allows only listed hosts behind a proxy', async () => {
		const proxied = { ...LISTED, proxy: true };

		expect(await refusedHost('https://gitlab.com/x.git', proxied)).toBe('gitlab.com');
		expect(
			await refusedHost('https://gitlab.acme.example/x.git', proxied, resolvingTo('10.0.0.5'))
		).toBeUndefined();
	});

	it('allows local repositories only to a policy that says so', async () => {
		const local = { ...PUBLIC_ONLY, allowLocal: true };

		expect(await checkConnection('file:///srv/x.git', local)).toEqual({
			url: 'file:///srv/x.git',
			local: true
		});
		expect(await checkConnection('http://127.0.0.1:9418/x.git', local)).toMatchObject({
			local: true
		});
		expect(await refusedHost('http://127.0.0.1:9418/x.git')).toBe('127.0.0.1:9418');
	});

	it('says which host was refused and how to allow it', async () => {
		await expect(checkConnection('https://10.0.0.5/x.git', PUBLIC_ONLY)).rejects.toThrow(
			"The server may not connect to 10.0.0.5. If it is your organisation's Git server, ask the person running grimoire to add it to GIT_ALLOWED_HOSTS."
		);
	});
});

describe('isPublicAddress', () => {
	it.each(['8.8.8.8', '172.65.251.78', '2606:4700::1', '2a00:1450::1'])('accepts %s', (address) => {
		expect(isPublicAddress(address)).toBe(true);
	});

	it.each([
		'224.0.0.1',
		'255.255.255.255',
		'198.18.0.1',
		'2001:db8::1',
		'2002:a00:1::1',
		'ff02::1'
	])('refuses %s', (address) => {
		expect(isPublicAddress(address)).toBe(false);
	});
});

describe('connectionPolicy', () => {
	it.each(['HTTPS_PROXY', 'https_proxy', 'ALL_PROXY', 'all_proxy'])(
		'counts %s as a configured proxy',
		(name) => {
			expect(connectionPolicy([], { [name]: 'http://proxy:3128' }).proxy).toBe(true);
		}
	);

	it('ignores HTTP_PROXY and NO_PROXY, which Git does not use for https', () => {
		expect(connectionPolicy([], { HTTP_PROXY: 'http://proxy', NO_PROXY: '*' }).proxy).toBe(false);
	});
});

describe('parseAllowedHosts', () => {
	it('reads host names separated by commas or spaces, in lower case', () => {
		expect(parseAllowedHosts('GitLab.acme.example, git.acme.example localhost')).toEqual([
			'gitlab.acme.example',
			'git.acme.example',
			'localhost'
		]);
		expect(parseAllowedHosts(undefined)).toEqual([]);
	});

	it.each(['https://gitlab.acme.example', 'gitlab.acme.example:8443', '*.acme.example'])(
		'refuses %s, which is not a host name',
		(value) => {
			expect(() => parseAllowedHosts(value)).toThrow(`GIT_ALLOWED_HOSTS "${value}"`);
		}
	);
});
