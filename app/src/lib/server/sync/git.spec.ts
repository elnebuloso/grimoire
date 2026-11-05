import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer as createHttpServer, type Server as HttpServer } from 'node:http';
import { createServer, type AddressInfo, type Socket } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkRemote, gitEnvironment, redact, redirectTarget, remoteCommit } from './git';

// Fixture repositories and servers are local; the server itself never allows them.
const LOCAL = { allowedHosts: [], proxy: false, allowLocal: true };
const remote = {
	url: 'https://git.example/platform/auth.git',
	username: 'deploy',
	token: 'glpat-secret',
	policy: LOCAL
};
const encoded = Buffer.from('deploy:glpat-secret').toString('base64');

describe('gitEnvironment', () => {
	const checked = { url: remote.url, pin: 'git.example:443:203.0.113.7' };
	const isolated = {
		GIT_TERMINAL_PROMPT: '0',
		GIT_CONFIG_NOSYSTEM: '1',
		GIT_CONFIG_GLOBAL: '/dev/null'
	};

	it('pins the address, refuses redirects and other protocols, and scopes the token to the URL', () => {
		expect(gitEnvironment(remote, checked)).toEqual({
			...isolated,
			GIT_CONFIG_COUNT: '5',
			GIT_CONFIG_KEY_0: 'http.followRedirects',
			GIT_CONFIG_VALUE_0: 'false',
			GIT_CONFIG_KEY_1: 'http.curloptResolve',
			GIT_CONFIG_VALUE_1: 'git.example:443:203.0.113.7',
			GIT_CONFIG_KEY_2: 'protocol.allow',
			GIT_CONFIG_VALUE_2: 'never',
			GIT_CONFIG_KEY_3: 'protocol.https.allow',
			GIT_CONFIG_VALUE_3: 'always',
			GIT_CONFIG_KEY_4: 'http.https://git.example/platform/auth.git.extraHeader',
			GIT_CONFIG_VALUE_4: `Authorization: Basic ${encoded}`
		});
	});

	it('passes no credentials without a token', () => {
		expect(gitEnvironment({ ...remote, token: null }, checked)).toMatchObject({
			GIT_CONFIG_COUNT: '4'
		});
	});

	it('reads no system or user configuration and never prompts, also without a remote', () => {
		expect(gitEnvironment()).toEqual(isolated);
	});
});

describe('redact', () => {
	it('removes the token, the encoded header and credentials in URLs', () => {
		const message = `fatal: https://deploy:glpat-secret@git.example/x.git failed with glpat-secret, header ${encoded}`;
		const redacted = redact(message, remote);
		expect(redacted).toBe('fatal: https://git.example/x.git failed with ***, header ***');
	});
});

/** Runs `run` against a server that accepts connections and never answers. */
async function withSilentServer(run: (url: string) => Promise<void>) {
	const sockets: Socket[] = [];
	const server = createServer((socket) => sockets.push(socket));
	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
	const { port } = server.address() as { port: number };
	try {
		await run(`http://127.0.0.1:${port}/auth.git`);
	} finally {
		sockets.forEach((socket) => socket.destroy());
		server.close();
	}
}

describe('checkRemote', () => {
	let directory: string;
	let url: string;
	let commit: string;

	beforeAll(() => {
		directory = mkdtempSync(join(tmpdir(), 'grimoire-check-'));
		const work = join(directory, 'work');
		const git = (...args: string[]) =>
			execFileSync('git', args, { cwd: work, encoding: 'utf8' }).trim();
		execFileSync('git', ['init', '--quiet', '--initial-branch=main', work]);
		writeFileSync(join(work, 'index.md'), '# Docs\n');
		git('add', '.');
		git('-c', 'user.name=t', '-c', 'user.email=t@example.com', 'commit', '--quiet', '-m', 'x');
		commit = git('rev-parse', 'HEAD');
		execFileSync('git', ['clone', '--quiet', '--bare', work, join(directory, 'docs.git')]);
		url = `file://${join(directory, 'docs.git')}`;
	});

	afterAll(() => rmSync(directory, { recursive: true, force: true }));

	it('reports the commit of the branch', async () => {
		expect(await checkRemote({ url, policy: LOCAL }, 'main')).toEqual({ status: 'ok', commit });
	});

	it('reports a branch the repository does not have', async () => {
		expect(await checkRemote({ url, policy: LOCAL }, 'develop')).toEqual({ status: 'no-branch' });
	});

	it('counts a repository that is not there as refused', async () => {
		const missing = `file://${join(directory, 'missing.git')}`;

		expect(await checkRemote({ url: missing, policy: LOCAL }, 'main')).toMatchObject({
			status: 'refused'
		});
	});

	it('runs no command for a URL that looks like an option', async () => {
		const marker = join(directory, 'marker');

		const check = await checkRemote(
			{ url: `--upload-pack=touch ${marker} #`, policy: LOCAL },
			'main'
		);

		expect(check.status).not.toBe('ok');
		expect(existsSync(marker)).toBe(false);
	});

	it('counts a server that never answers as unreachable', async () => {
		await withSilentServer(async (silent) => {
			expect(await checkRemote({ url: silent, policy: LOCAL }, 'main', 500)).toEqual({
				status: 'unreachable',
				detail: 'git ls-remote failed: no answer within 0.5 s'
			});
		});
	});
});

describe('remoteCommit', () => {
	it('gives up on a server that never answers', async () => {
		await withSilentServer(async (silent) => {
			await expect(remoteCommit({ url: silent, policy: LOCAL }, 'main', 500)).rejects.toThrow(
				'git ls-remote failed: no answer within 0.5 s'
			);
		});
	});
});

describe('a Git server that refuses the credentials', () => {
	let server: HttpServer;
	let url: string;

	beforeAll(async () => {
		// Answers like GitLab, GitHub and Forgejo do to a wrong token or a private repository.
		server = createHttpServer((_request, response) => {
			response.writeHead(401, { 'WWW-Authenticate': 'Basic realm="Git"' }).end();
		});
		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
		url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/platform/auth.git`;
	});

	afterAll(() => server.close());

	it('says the username and token were refused, without the token', async () => {
		const check = await checkRemote(
			{ url, username: 'deploy', token: 'glpat-secret', policy: LOCAL },
			'main'
		);

		expect(check).toEqual({
			status: 'refused',
			detail:
				'git ls-remote failed: the Git server refused the username and token: wrong, expired or revoked, or without access to this repository'
		});
	});

	it('says the repository needs a username and token when the source has none', async () => {
		await expect(remoteCommit({ url, policy: LOCAL }, 'main')).rejects.toThrow(
			'git ls-remote failed: the Git server asks for a username and token: the repository is private, or there is none at this URL'
		);
	});
});

describe('a Git server that redirects', () => {
	const servers: HttpServer[] = [];
	let received: string[];
	let authorization: (string | undefined)[];
	let origin: string;

	async function listen(name: string, answer: (url: string) => [number, string?]) {
		const server = createHttpServer((request, response) => {
			received.push(name);
			authorization.push(request.headers.authorization);
			const [status, location] = answer(request.url ?? '');
			response.writeHead(status, location ? { location } : {}).end();
		});
		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
		servers.push(server);
		return (server.address() as AddressInfo).port;
	}

	beforeAll(async () => {
		const otherPort = await listen('other host', () => [404]);
		const originPort = await listen('origin', (url) => {
			if (url.startsWith('/same/')) return [302, url.replace('/same/', '/moved/')];
			if (url.startsWith('/other/')) return [302, `http://localhost:${otherPort}${url}`];
			// As GitLab answers a project path without `.git`.
			if (url.startsWith('/group/project/')) {
				return [
					301,
					`http://deploy:pw@127.0.0.1:${originPort}${url.replace('/project/', '/project.git/')}#top`
				];
			}
			return [404];
		});
		origin = `http://127.0.0.1:${originPort}`;
	});

	afterAll(() => servers.forEach((server) => server.close()));

	beforeEach(() => {
		received = [];
		authorization = [];
	});

	// A redirect could lead from the checked address to any other, internal ones included.
	it.each(['/same/auth.git', '/other/auth.git'])('is not followed, for %s', async (path) => {
		const check = await checkRemote(
			{ url: `${origin}${path}`, username: 'deploy', token: 'glpat-secret', policy: LOCAL },
			'main'
		);

		expect(check.status).not.toBe('ok');
		expect(received).toEqual(['origin']);
	});

	it('is reported as a redirect, with what to do, on a check and on a sync', async () => {
		const project = { url: `${origin}/group/project`, policy: LOCAL };
		const advice =
			'the Git server redirects this URL elsewhere (HTTP 301): use the clone URL of the repository, usually ending in .git; a moved project has a new path';

		expect(await checkRemote(project, 'main')).toEqual({
			status: 'redirected',
			httpStatus: 301,
			detail: `git ls-remote failed: ${advice}`
		});
		await expect(remoteCommit(project, 'main')).rejects.toThrow(advice);
	});

	it('names a target on the same host, without credentials, query or fragment', async () => {
		const target = await redirectTarget({
			url: `${origin}/group/project`,
			username: 'deploy',
			token: 'glpat-secret',
			policy: LOCAL
		});

		expect(target).toBe(`${origin}/group/project.git`);
		// One request, with the credentials Git would send, and none to the target.
		expect(received).toEqual(['origin']);
		expect(authorization).toEqual([`Basic ${encoded}`]);
	});

	it('names no target on another host, and none where nothing redirects', async () => {
		expect(
			await redirectTarget({ url: `${origin}/other/auth.git`, policy: LOCAL })
		).toBeUndefined();
		expect(await redirectTarget({ url: `${origin}/missing.git`, policy: LOCAL })).toBeUndefined();
		expect(received).toEqual(['origin', 'origin']);
	});

	it('fails without an answer, for the caller to fall back to the message without target', async () => {
		const closed = createHttpServer();
		await new Promise<void>((resolve) => closed.listen(0, '127.0.0.1', resolve));
		const port = (closed.address() as AddressInfo).port;
		closed.close();

		await expect(
			redirectTarget({ url: `http://127.0.0.1:${port}/group/project`, policy: LOCAL })
		).rejects.toThrow();
	});
});

describe('a host the server may not connect to', () => {
	const PUBLIC_ONLY = { allowedHosts: [], proxy: false };

	it('is not contacted, and the check says why', async () => {
		const check = await checkRemote(
			{ url: 'https://127.0.0.1/auth.git', policy: PUBLIC_ONLY },
			'main'
		);

		expect(check).toMatchObject({ status: 'forbidden', host: '127.0.0.1' });
	});

	it('fails a sync with the message for the operator', async () => {
		await expect(
			remoteCommit({ url: 'https://localhost/auth.git', policy: PUBLIC_ONLY }, 'main')
		).rejects.toThrow('The server may not connect to localhost.');
	});
});
