import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, type Socket } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkRemote, credentialEnvironment, redact, remoteCommit } from './git';

const remote = {
	url: 'https://git.example/platform/auth.git',
	username: 'deploy',
	token: 'glpat-secret'
};
const encoded = Buffer.from('deploy:glpat-secret').toString('base64');

describe('credentialEnvironment', () => {
	it('passes the token as a header scoped to the remote URL', () => {
		expect(credentialEnvironment(remote)).toEqual({
			GIT_TERMINAL_PROMPT: '0',
			GIT_CONFIG_COUNT: '1',
			GIT_CONFIG_KEY_0: 'http.https://git.example/platform/auth.git.extraHeader',
			GIT_CONFIG_VALUE_0: `Authorization: Basic ${encoded}`
		});
	});

	it('passes no credentials without a token, and never prompts', () => {
		expect(credentialEnvironment({ url: remote.url })).toEqual({ GIT_TERMINAL_PROMPT: '0' });
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
		expect(await checkRemote({ url }, 'main')).toEqual({ status: 'ok', commit });
	});

	it('reports a branch the repository does not have', async () => {
		expect(await checkRemote({ url }, 'develop')).toEqual({ status: 'no-branch' });
	});

	it('counts a repository that is not there as refused', async () => {
		const missing = `file://${join(directory, 'missing.git')}`;

		expect(await checkRemote({ url: missing }, 'main')).toMatchObject({ status: 'refused' });
	});

	it('counts a server that never answers as unreachable', async () => {
		await withSilentServer(async (silent) => {
			expect(await checkRemote({ url: silent }, 'main', 500)).toEqual({
				status: 'unreachable',
				detail: 'git ls-remote failed: no answer within 0.5 s'
			});
		});
	});
});

describe('remoteCommit', () => {
	it('gives up on a server that never answers', async () => {
		await withSilentServer(async (silent) => {
			await expect(remoteCommit({ url: silent }, 'main', 500)).rejects.toThrow(
				'git ls-remote failed: no answer within 0.5 s'
			);
		});
	});
});
