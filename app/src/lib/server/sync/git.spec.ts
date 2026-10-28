import { describe, it, expect } from 'vitest';
import { credentialEnvironment, redact } from './git';

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
