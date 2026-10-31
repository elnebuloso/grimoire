import { describe, it, expect } from 'vitest';
import { syncErrorKind } from './error-kind';

describe('syncErrorKind', () => {
	it.each([
		['source path "archive/docs" does not exist in the repository', 'path'],
		['branch "main" not found in https://git.example.com/platform/docs.git', 'branch'],
		[
			'git clone failed: the Git server refused the username and token: wrong, expired or revoked, or without access to this repository',
			'access'
		],
		[
			'git ls-remote failed: remote: Repository not found.\nfatal: repository https://git.example.com/x.git/ not found',
			'access'
		],
		['fatal: Authentication failed for https://git.example.com/x.git/', 'access'],
		['git ls-remote failed: no answer within 30 s', 'unreachable'],
		[
			'git ls-remote failed: fatal: unable to access https://git.example.com/x.git/: Could not resolve host: git.example.com',
			'unreachable'
		],
		['indexing took longer than 10 minutes', 'deadline'],
		['indexing ended with SIGKILL before it finished, out of memory for example', 'aborted'],
		['no page could be indexed, docs/a.md: skipped, bad front matter', 'noPage'],
		['a source can only be indexed into a database file', 'unknown']
	])('recognises %j as %s', (message, kind) => {
		expect(syncErrorKind(message)).toBe(kind);
	});
});
