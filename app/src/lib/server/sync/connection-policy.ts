// Loaded by the indexing child process from source: relative imports with `.ts`, nothing Vite
// resolves.
import { lookup as dnsLookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';
import type { DatabaseSync } from 'node:sqlite';

/** Where the server may open Git connections. Travels to the indexing process with the job. */
export interface ConnectionPolicy {
	/** `GIT_ALLOWED_HOSTS`: host names reached on any address and port, lower case. */
	allowedHosts: string[];
	/** A proxy is configured: the server cannot see where it connects, so only listed hosts. */
	proxy: boolean;
	/** `file://` and `http://127.0.0.1` without a check: only tests set it, never the environment. */
	allowLocal?: boolean;
}

/** What a Git call may connect to: the URL to use and, for a host name, the address it resolved to. */
export interface CheckedRemote {
	/** `href` of the parsed URL, never the input as typed. */
	url: string;
	/** `<host>:<port>:<address>` for `http.curloptResolve`; undefined when nothing is looked up. */
	pin?: string;
	/** A local repository of a test: no protocol restriction. */
	local?: boolean;
}

export type Lookup = (host: string) => Promise<{ address: string; family: number }[]>;

/** Thrown for a URL the server must not connect to. */
export class ConnectionRefused extends Error {
	readonly host: string;

	constructor(host: string) {
		super(
			`The server may not connect to ${host}. If it is your organisation's Git server, ask the person running grimoire to add it to GIT_ALLOWED_HOSTS.`
		);
		this.host = host;
	}
}

const PROXY_VARIABLES = ['HTTPS_PROXY', 'https_proxy', 'ALL_PROXY', 'all_proxy'];

/** The policy of the running server: from `GIT_ALLOWED_HOSTS` and the proxy variables. */
export function connectionPolicy(
	allowedHosts: string[],
	environment: NodeJS.ProcessEnv = process.env
): ConnectionPolicy {
	return { allowedHosts, proxy: PROXY_VARIABLES.some((name) => Boolean(environment[name])) };
}

/** `GIT_ALLOWED_HOSTS`: exact host names, separated by commas or spaces. Empty when not set. */
export function parseAllowedHosts(value: string | undefined): string[] {
	return (value ?? '')
		.split(/[\s,]+/)
		.filter(Boolean)
		.map((entry) => {
			// Exact names only: no scheme, port or wildcard.
			if (!/^[a-z0-9-]+(\.[a-z0-9-]+)*$/i.test(entry)) {
				throw new Error(
					`GIT_ALLOWED_HOSTS "${entry}" is not a host name such as gitlab.example.com`
				);
			}
			return entry.toLowerCase();
		});
}

// Everything that is not a public internet address. IPv6 must lie in 2000::/3, the global unicast
// block; that already excludes IPv4-mapped, NAT64, unique local, link-local and multicast.
const NOT_PUBLIC = new BlockList();
for (const [network, prefix] of [
	['0.0.0.0', 8],
	['10.0.0.0', 8],
	['100.64.0.0', 10],
	['127.0.0.0', 8],
	['169.254.0.0', 16],
	['172.16.0.0', 12],
	['192.0.0.0', 24],
	['192.0.2.0', 24],
	['192.88.99.0', 24],
	['192.168.0.0', 16],
	['198.18.0.0', 15],
	['198.51.100.0', 24],
	['203.0.113.0', 24],
	['224.0.0.0', 3]
] as const) {
	NOT_PUBLIC.addSubnet(network, prefix, 'ipv4');
}
for (const [network, prefix] of [
	['2001::', 23],
	['2001:db8::', 32],
	['2002::', 16],
	['3fff::', 20]
] as const) {
	NOT_PUBLIC.addSubnet(network, prefix, 'ipv6');
}
const GLOBAL_UNICAST_V6 = new BlockList();
GLOBAL_UNICAST_V6.addSubnet('2000::', 3, 'ipv6');

/** Whether `address` is a public internet address. */
export function isPublicAddress(address: string): boolean {
	const family = isIP(address);
	if (family === 4) return !NOT_PUBLIC.check(address, 'ipv4');
	if (family === 6) {
		return GLOBAL_UNICAST_V6.check(address, 'ipv6') && !NOT_PUBLIC.check(address, 'ipv6');
	}
	return false;
}

/**
 * Checks `input` against the rules for outgoing Git connections and resolves its host once; Git
 * must then connect to that address only. Throws `ConnectionRefused` for a URL it must not reach.
 */
export async function checkConnection(
	input: string,
	policy: ConnectionPolicy,
	lookup: Lookup = (host) => dnsLookup(host, { all: true })
): Promise<CheckedRemote> {
	let url: URL;
	try {
		url = new URL(input);
	} catch {
		throw new ConnectionRefused(input);
	}
	if (policy.allowLocal && isLocal(url)) return { url: url.href, local: true };
	if (url.protocol !== 'https:') throw new ConnectionRefused(url.host);

	// The URL parser already turns `2130706433` or `0x7f.1` into `127.0.0.1`.
	const host = url.hostname.replace(/^\[(.*)\]$/, '$1');
	const listed = policy.allowedHosts.includes(host);
	if (!listed && (policy.proxy || isIP(host) || url.port !== '')) {
		throw new ConnectionRefused(url.host);
	}
	if (isIP(host)) return { url: url.href };

	const addresses = await lookup(host);
	if (addresses.length === 0) throw new Error(`${host} has no address`);
	if (!listed && !addresses.every(({ address }) => isPublicAddress(address))) {
		throw new ConnectionRefused(url.host);
	}
	const { address, family } = addresses[0];
	const port = url.port || '443';
	return { url: url.href, pin: `${host}:${port}:${family === 6 ? `[${address}]` : address}` };
}

function isLocal(url: URL): boolean {
	return url.protocol === 'file:' || (url.protocol === 'http:' && url.hostname === '127.0.0.1');
}

/**
 * The sources of `db` whose Git host `policy` refuses, by slug, with the reason: after an update,
 * or after an import from another instance. An address that does not resolve right now is the
 * sync's to report.
 */
export async function refusedSources(
	db: DatabaseSync,
	policy: ConnectionPolicy
): Promise<{ slug: string; reason: string }[]> {
	const sources = db.prepare('SELECT slug, git_url FROM sources ORDER BY slug').all() as {
		slug: string;
		git_url: string;
	}[];
	const refused: { slug: string; reason: string }[] = [];
	for (const source of sources) {
		try {
			await checkConnection(source.git_url, policy);
		} catch (error) {
			if (error instanceof ConnectionRefused) {
				refused.push({ slug: source.slug, reason: error.message });
			}
		}
	}
	return refused;
}
