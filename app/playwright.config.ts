import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defineConfig } from '@playwright/test';

// Every run starts with a fresh database. Workers load this file again and inherit the
// directory through the environment of the runner, so they read the same server log.
// ponytail: the directory stays behind (a few KB per run); add a globalTeardown if that piles up.
process.env.E2E_DIR ??= mkdtempSync(join(tmpdir(), 'grimoire-e2e-'));
const directory = process.env.E2E_DIR;

// Sources must use https, and the tests must not need the network: git in the server maps these
// URLs to local paths. `auth.git` has a branch `main` but no `docs/`, so a sync of the default path
// reaches the repository and still fails; `missing.git` does not exist.
const E2E_GIT = 'https://git.e2e.example/platform';
const repository = join(directory, 'auth.git');
const gitConfig = join(directory, 'gitconfig');
if (!existsSync(repository)) {
	const work = join(directory, 'auth');
	execFileSync('git', ['init', '--quiet', '--initial-branch=main', work]);
	writeFileSync(join(work, 'README.md'), '# Auth\n');
	execFileSync('git', ['-C', work, 'add', '.']);
	execFileSync('git', [
		'-C',
		work,
		'-c',
		'user.name=e2e',
		'-c',
		'user.email=e2e@example.com',
		'commit',
		'--quiet',
		'-m',
		'README'
	]);
	execFileSync('git', ['clone', '--quiet', '--bare', work, repository]);
	writeFileSync(
		gitConfig,
		`[url "file://${repository}"]\n\tinsteadOf = ${E2E_GIT}/auth.git\n` +
			`[url "file://${join(directory, 'missing.git')}"]\n\tinsteadOf = ${E2E_GIT}/missing.git\n`
	);
}

export default defineConfig({
	webServer: {
		command: `npm run build && node build > ${join(directory, 'server.log')} 2>&1`,
		port: 4173,
		env: {
			PORT: '4173',
			DATABASE_PATH: join(directory, 'grimoire.db'),
			TOKEN_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString('base64'),
			PROTOCOL_HEADER: 'x-forwarded-proto',
			GIT_CONFIG_GLOBAL: gitConfig
		}
	},
	// grimoire assumes https; without this header every admin form fails the origin check.
	use: { extraHTTPHeaders: { 'x-forwarded-proto': 'http' } },
	testMatch: '**/*.e2e.{ts,js}'
});
