import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { FIXTURE } from './documentations';

// Ignored by git; cloned once, after that the benchmark needs no network.
const CACHE = join(import.meta.dirname, '../.benchmark');
const BRANCH = 'benchmark';

function git(cwd: string, ...args: string[]): string {
	return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

/**
 * A bare clone of the fixture repository whose branch `benchmark` is the pinned commit, as a
 * `file://` URL a source can sync from. Fetches only when the commit is not in the cache yet.
 */
export function fixtureRepository(): string {
	const bare = join(CACHE, 'grimoire-fixture-docs.git');
	if (!existsSync(bare)) {
		mkdirSync(CACHE, { recursive: true });
		git(CACHE, 'clone', '--quiet', '--bare', FIXTURE.url, bare);
	}
	try {
		git(bare, 'cat-file', '-e', `${FIXTURE.commit}^{commit}`);
	} catch {
		git(bare, 'fetch', '--quiet', FIXTURE.url, FIXTURE.commit);
	}
	git(bare, 'update-ref', `refs/heads/${BRANCH}`, FIXTURE.commit);
	// A sync clones without blobs, as from a Git hosting server.
	git(bare, 'config', 'uploadpack.allowFilter', 'true');
	return `file://${bare}`;
}

export const FIXTURE_BRANCH = BRANCH;
