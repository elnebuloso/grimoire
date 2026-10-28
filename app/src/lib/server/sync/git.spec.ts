import { describe, it, expect } from 'vitest';
import { createServer, type Socket } from 'node:net';
import { credentialEnvironment, redact, remoteCommit } from './git';

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

describe('remoteCommit', () => {
	it('gives up on a server that never answers', async () => {
		const sockets: Socket[] = [];
		const server = createServer((socket) => sockets.push(socket));
		await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
		const { port } = server.address() as { port: number };
		try {
			await expect(
				remoteCommit({ url: `http://127.0.0.1:${port}/auth.git` }, 'main', 500)
			).rejects.toThrow('git ls-remote failed: no answer within 0.5 s');
		} finally {
			sockets.forEach((socket) => socket.destroy());
			server.close();
		}
	});
});
