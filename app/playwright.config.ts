import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { defineConfig } from '@playwright/test';

// Every run starts with a fresh database. Workers load this file again and inherit the
// directory through the environment of the runner, so they read the same server log.
// ponytail: the directory stays behind (a few KB per run); add a globalTeardown if that piles up.
process.env.E2E_DIR ??= mkdtempSync(join(tmpdir(), 'grimoire-e2e-'));
const directory = process.env.E2E_DIR;

export default defineConfig({
	webServer: {
		command: `npm run build && node build > ${join(directory, 'server.log')} 2>&1`,
		port: 4173,
		env: {
			PORT: '4173',
			DATABASE_PATH: join(directory, 'grimoire.db'),
			TOKEN_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString('base64'),
			PROTOCOL_HEADER: 'x-forwarded-proto'
		}
	},
	// grimoire assumes https; without this header every admin form fails the origin check.
	use: { extraHTTPHeaders: { 'x-forwarded-proto': 'http' } },
	testMatch: '**/*.e2e.{ts,js}'
});
