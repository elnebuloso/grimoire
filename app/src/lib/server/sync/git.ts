import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

// A clone of a large repository over a slow link takes long; a hung server must not block forever.
const GIT_TIMEOUT_MS = 5 * 60 * 1000;
// A check only exchanges a few lines; with many sources one silent server must not hold up the rest.
export const CHECK_TIMEOUT_MS = 30 * 1000;

export interface GitRemote {
	url: string;
	username?: string | null;
	token?: string | null;
}

/** Hash of the latest commit of `branch` on the remote; nothing is downloaded. */
export async function remoteCommit(
	remote: GitRemote,
	branch: string,
	timeoutMs = CHECK_TIMEOUT_MS
): Promise<string> {
	const output = await git(['ls-remote', remote.url, `refs/heads/${branch}`], remote, timeoutMs);
	const hash = output.split('\t')[0].trim();
	if (!hash) throw new Error(`branch "${branch}" not found in ${redactUrl(remote.url)}`);
	return hash;
}

/**
 * Shallow, blob-less clone of `branch` into `dir` with only `path` checked out.
 * A path of `.` or empty checks out the whole repository.
 */
export async function sparseClone(remote: GitRemote, branch: string, path: string, dir: string) {
	const wholeRepository = path === '' || path === '.';
	const sparse = wholeRepository ? [] : ['--sparse'];
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
			remote.url,
			dir
		],
		remote
	);
	if (!wholeRepository) await git(['-C', dir, 'sparse-checkout', 'set', '--', path], remote);
}

/** Checks out further directories of a sparse clone, fetching their files from the remote. */
export async function addSparseDirectories(remote: GitRemote, dir: string, directories: string[]) {
	await git(['-C', dir, 'sparse-checkout', 'add', '--', ...directories], remote);
}

export async function headCommit(dir: string): Promise<string> {
	return (await git(['-C', dir, 'rev-parse', 'HEAD'])).trim();
}

async function git(
	args: string[],
	remote?: GitRemote,
	timeoutMs = GIT_TIMEOUT_MS
): Promise<string> {
	const command = args[0] === '-C' ? args[2] : args[0];
	try {
		const { stdout } = await run('git', args, {
			env: { ...process.env, ...credentialEnvironment(remote) },
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
		const reason = killed ? `no answer within ${timeoutMs / 1000} s` : stderr?.trim() || message;
		// No `cause`: the original error carries the unredacted command line and output.
		// eslint-disable-next-line preserve-caught-error
		throw new Error(redact(`git ${command} failed: ${reason}`, remote));
	}
}

/**
 * Passes the credentials as a header scoped to the remote URL through git's environment
 * configuration, so they appear neither in the process arguments nor in `.git/config`.
 */
export function credentialEnvironment(remote?: GitRemote): Record<string, string> {
	const environment: Record<string, string> = { GIT_TERMINAL_PROMPT: '0' };
	if (!remote?.token) return environment;
	return {
		...environment,
		GIT_CONFIG_COUNT: '1',
		GIT_CONFIG_KEY_0: `http.${remote.url}.extraHeader`,
		GIT_CONFIG_VALUE_0: `Authorization: Basic ${basicCredentials(remote)}`
	};
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
