import { execFile } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { isIP } from 'node:net';
import { tmpdir } from 'node:os';
import { join, posix } from 'node:path';
import { promisify } from 'node:util';
import {
	checkConnection,
	ConnectionRefused,
	type CheckedRemote,
	type ConnectionPolicy
} from './connection-policy.ts';
import { SyncFailure, UNRESOLVABLE, type SyncErrorKind } from './failure.ts';

const run = promisify(execFile);

// A clone of a large repository over a slow link takes long; a hung server must not block forever.
const GIT_TIMEOUT_MS = 5 * 60 * 1000;
// A check only exchanges a few lines; with many sources one silent server must not hold up the rest.
export const CHECK_TIMEOUT_MS = 30 * 1000;

export interface GitRemote {
	url: string;
	username?: string | null;
	token?: string | null;
	/** Where the server may connect; checked before every call that reaches the remote. */
	policy: ConnectionPolicy;
}

export type RemoteCheck =
	| { status: 'ok'; commit: string }
	| { status: 'no-branch' }
	| { status: 'refused' | 'unreachable'; detail: string }
	/** The Git server answered with a redirect, which Git does not follow. */
	| { status: 'redirected'; httpStatus: number; detail: string }
	/** The server may not connect to `host` at all. */
	| { status: 'forbidden'; host: string; detail: string };

// Git hosts answer a missing repository and missing access alike, so both count as refused.
export const REFUSED =
	/authentication failed|refused the username|asks for a username|\b40[134]\b|not found|does not appear to be a git repository/i;
// Git wanted to ask for other credentials, which grimoire never lets it do: the server refused
// the ones it got, or wants some.
const CREDENTIALS_ASKED = /could not read (username|password) for/i;
// What Git says when it refuses a redirect; it does not name the target.
const REDIRECT_REFUSED = /returned error: (30[1278])\b/;
const REDIRECT_REASON = /redirects this URL elsewhere \(HTTP (\d{3})\)/;

/** Whether the remote answers and has `branch`; nothing is downloaded. */
export async function checkRemote(
	remote: GitRemote,
	branch: string,
	timeoutMs = CHECK_TIMEOUT_MS
): Promise<RemoteCheck> {
	let output: string;
	try {
		const connection = await connect(remote);
		// `--` keeps a URL that starts with `-` from being read as an option such as `--upload-pack`.
		output = await git(
			['ls-remote', '--', connection.url, `refs/heads/${branch}`],
			connection,
			timeoutMs
		);
	} catch (error) {
		const detail = (error as Error).message;
		if (error instanceof ConnectionRefused) {
			return { status: 'forbidden', host: error.host, detail };
		}
		const redirect = REDIRECT_REASON.exec(detail);
		if (redirect) return { status: 'redirected', httpStatus: Number(redirect[1]), detail };
		return { status: REFUSED.test(detail) ? 'refused' : 'unreachable', detail };
	}
	const commit = output.split('\t')[0].trim();
	return commit ? { status: 'ok', commit } : { status: 'no-branch' };
}

/** Hash of the latest commit of `branch` on the remote; nothing is downloaded. */
export async function remoteCommit(
	remote: GitRemote,
	branch: string,
	timeoutMs = CHECK_TIMEOUT_MS
): Promise<string> {
	const check = await checkRemote(remote, branch, timeoutMs);
	if (check.status === 'ok') return check.commit;
	if (check.status === 'no-branch') {
		throw new SyncFailure('branch', `branch "${branch}" not found in ${redactUrl(remote.url)}`);
	}
	throw new SyncFailure(checkFailureKind(check), check.detail);
}

function checkFailureKind(check: Exclude<RemoteCheck, { status: 'ok' | 'no-branch' }>) {
	switch (check.status) {
		case 'refused':
			return 'access';
		case 'redirected':
			return 'redirect';
		case 'forbidden':
			return 'forbidden';
		case 'unreachable':
			return UNRESOLVABLE.test(check.detail) ? 'noAddress' : 'unreachable';
	}
}

/**
 * Whether `path` is a directory on `branch`; an empty path is the whole repository. Downloads the
 * tree of the latest commit, no file contents.
 */
export async function remotePathExists(
	remote: GitRemote,
	branch: string,
	path: string,
	timeoutMs: number
): Promise<boolean> {
	const directory = posix.normalize(path.trim() || '.').replace(/\/+$/, '');
	if (directory === '.') return true;
	const dir = mkdtempSync(join(tmpdir(), 'grimoire-path-'));
	try {
		const connection = await connect(remote);
		await git(
			[
				'clone',
				'--depth',
				'1',
				'--filter=blob:none',
				'--no-checkout',
				'--branch',
				branch,
				'--',
				connection.url,
				dir
			],
			connection,
			timeoutMs
		);
		const type = await git(['-C', dir, 'cat-file', '-t', `HEAD:${directory}`]).catch(() => '');
		return type.trim() === 'tree';
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}

/**
 * Shallow, blob-less clone of `branch` into `dir` with only `path` checked out.
 * A path of `.` or empty checks out the whole repository.
 */
export async function sparseClone(remote: GitRemote, branch: string, path: string, dir: string) {
	const wholeRepository = path === '' || path === '.';
	const sparse = wholeRepository ? [] : ['--sparse'];
	const connection = await connect(remote);
	await git(
		[
			'clone',
			'--depth',
			'1',
			'--filter=blob:none',
			...sparse,
			'--branch',
			branch,
			'--',
			connection.url,
			dir
		],
		connection
	);
	// Fetches the blobs of `path` lazily, from the URL the clone stored.
	if (!wholeRepository) {
		await git(['-C', dir, 'sparse-checkout', 'set', '--', path], await connect(remote));
	}
}

/** Checks out further directories of a sparse clone, fetching their files from the remote. */
export async function addSparseDirectories(remote: GitRemote, dir: string, directories: string[]) {
	await git(['-C', dir, 'sparse-checkout', 'add', '--', ...directories], await connect(remote));
}

export async function headCommit(dir: string): Promise<string> {
	return (await git(['-C', dir, 'rev-parse', 'HEAD'])).trim();
}

/** A remote checked against its policy, with the environment that holds Git to that check. */
interface Connection {
	remote: GitRemote;
	url: string;
	environment: Record<string, string>;
}

async function connect(remote: GitRemote): Promise<Connection> {
	const checked = await checkConnection(remote.url, remote.policy);
	return { remote, url: checked.url, environment: gitEnvironment(remote, checked) };
}

async function git(
	args: string[],
	connection?: Connection,
	timeoutMs = GIT_TIMEOUT_MS
): Promise<string> {
	const command = args[0] === '-C' ? args[2] : args[0];
	const remote = connection?.remote;
	try {
		const { stdout } = await run('git', args, {
			env: { ...process.env, ...(connection?.environment ?? gitEnvironment()) },
			timeout: timeoutMs,
			maxBuffer: 16 * 1024 * 1024
		});
		return stdout;
	} catch (error) {
		const { stderr, message, killed } = error as {
			stderr?: string;
			message: string;
			killed?: boolean;
		};
		const output = stderr?.trim() || message;
		let kind: SyncErrorKind = 'unreachable';
		let reason = output;
		if (killed) {
			reason = `no answer within ${timeoutMs / 1000} s`;
		} else if (CREDENTIALS_ASKED.test(output)) {
			kind = 'access';
			reason = credentialsProblem(remote);
		} else if (REDIRECT_REFUSED.test(output)) {
			kind = 'redirect';
			reason = redirectProblem(Number(REDIRECT_REFUSED.exec(output)![1]));
		} else if (UNRESOLVABLE.test(output)) {
			kind = 'noAddress';
		} else if (REFUSED.test(output)) {
			kind = 'access';
		}
		// No `cause`: the original error carries the unredacted command line and output.
		// eslint-disable-next-line preserve-caught-error
		throw new SyncFailure(kind, redact(`git ${command} failed: ${reason}`, remote));
	}
}

function redirectProblem(httpStatus: number): string {
	return `the Git server redirects this URL elsewhere (HTTP ${httpStatus}): use the clone URL of the repository, usually ending in .git; a moved project has a new path`;
}

/**
 * Where the Git server redirects `remote`, when the target lies on the same scheme, host and port;
 * undefined otherwise, or when the server does not redirect. Asks once, at the address the check
 * pins and with the credentials Git would send, and never requests the target: grimoire follows
 * no redirect, it only names one for a person to enter.
 */
export async function redirectTarget(
	remote: GitRemote,
	timeoutMs = CHECK_TIMEOUT_MS
): Promise<string | undefined> {
	const checked = await checkConnection(remote.url, remote.policy);
	if (checked.url.startsWith('file:')) return undefined;
	const base = new URL(checked.url);
	const asked = new URL(`${base.pathname.replace(/\/+$/, '')}/info/refs`, base);
	asked.search = '?service=git-upload-pack';
	const location = await locationHeader(asked, remote, checked, timeoutMs);
	if (!location) return undefined;
	const target = new URL(location, asked);
	if (target.origin !== base.origin) return undefined;
	target.username = '';
	target.password = '';
	target.search = '';
	target.hash = '';
	target.pathname = target.pathname.replace(/\/info\/refs$/, '');
	return target.href;
}

function locationHeader(
	url: URL,
	remote: GitRemote,
	checked: CheckedRemote,
	timeoutMs: number
): Promise<string | undefined> {
	const pinned = checked.pin && pinnedAddress(checked.pin);
	const request = url.protocol === 'https:' ? httpsRequest : httpRequest;
	const caFile = process.env.GIT_SSL_CAINFO;
	return new Promise((resolve, reject) => {
		const outgoing = request(
			url,
			{
				method: 'GET',
				timeout: timeoutMs,
				headers: remote.token ? { Authorization: `Basic ${basicCredentials(remote)}` } : {},
				// The same CA file Git trusts, replacing the defaults as it does for Git.
				...(caFile ? { ca: readFileSync(caFile) } : {}),
				...(pinned
					? {
							lookup: (_host: string, options: { all?: boolean }, callback: PinnedCallback) =>
								options.all
									? callback(null, [pinned])
									: callback(null, pinned.address, pinned.family)
						}
					: {})
			},
			(response) => {
				response.resume();
				const status = response.statusCode ?? 0;
				resolve(status >= 300 && status < 400 ? response.headers.location : undefined);
			}
		);
		outgoing.on('timeout', () => outgoing.destroy(new Error('no answer')));
		outgoing.on('error', reject);
		outgoing.end();
	});
}

type PinnedCallback = (
	error: Error | null,
	address: string | { address: string; family: number }[],
	family?: number
) => void;

// `http.curloptResolve` writes `<host>:<port>:<address>`, an IPv6 address in brackets.
function pinnedAddress(pin: string): { address: string; family: number } {
	const address = pin
		.split(':')
		.slice(2)
		.join(':')
		.replace(/^\[(.*)\]$/, '$1');
	return { address, family: isIP(address) };
}

function credentialsProblem(remote?: GitRemote): string {
	return remote?.token
		? 'the Git server refused the username and token: wrong, expired or revoked, or without access to this repository'
		: 'the Git server asks for a username and token: the repository is private, or there is none at this URL';
}

/**
 * The environment of a Git call: no system or user configuration (an `insteadOf` or `http.proxy`
 * there would change what was checked), no prompt, and for a remote its configuration through
 * `GIT_CONFIG_COUNT`, which also reaches the fetches Git makes lazily later in the same call. The
 * credentials go in as a header scoped to the URL, so they appear neither in the process arguments
 * nor in `.git/config`.
 */
export function gitEnvironment(
	remote?: GitRemote,
	checked?: CheckedRemote
): Record<string, string> {
	const environment: Record<string, string> = {
		GIT_TERMINAL_PROMPT: '0',
		GIT_CONFIG_NOSYSTEM: '1',
		GIT_CONFIG_GLOBAL: '/dev/null'
	};
	if (!remote || !checked) return environment;
	const config: [string, string][] = [['http.followRedirects', 'false']];
	if (checked.pin) config.push(['http.curloptResolve', checked.pin]);
	if (!checked.local) config.push(['protocol.allow', 'never'], ['protocol.https.allow', 'always']);
	if (remote.token) {
		config.push([
			`http.${checked.url}.extraHeader`,
			`Authorization: Basic ${basicCredentials(remote)}`
		]);
	}
	environment.GIT_CONFIG_COUNT = String(config.length);
	config.forEach(([key, value], index) => {
		environment[`GIT_CONFIG_KEY_${index}`] = key;
		environment[`GIT_CONFIG_VALUE_${index}`] = value;
	});
	return environment;
}

/** Removes the token, its encoded header value and credentials embedded in URLs from a message. */
export function redact(message: string, remote?: GitRemote): string {
	let redacted = redactUrl(message);
	if (remote?.token) {
		redacted = redacted.replaceAll(remote.token, '***').replaceAll(basicCredentials(remote), '***');
	}
	return redacted;
}

/** Drops `user:password@` from every URL in a text. */
export function redactUrl(text: string): string {
	return text.replace(/(\w+:\/\/)[^/\s@]+@/g, '$1');
}

function basicCredentials(remote: GitRemote): string {
	return Buffer.from(`${remote.username ?? ''}:${remote.token ?? ''}`).toString('base64');
}
