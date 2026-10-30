import { join } from 'node:path';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';

// Set by the agent environment (`make agent-start`): its dev server reads its own `.env` instead
// of the developer's `app/.env`, and keeps generated files and the dependency cache apart, because
// SvelteKit writes the loaded settings into the generated files and a second dev server in the
// same directory would overwrite them.
const agentDir = process.env.GRIMOIRE_AGENT_DIR;

export default defineConfig({
	cacheDir: agentDir ? `${agentDir}/vite` : undefined,
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter(),
			env: { dir: agentDir ?? '' },
			outDir: agentDir ? `${agentDir}/svelte-kit` : '.svelte-kit'
		}),
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			emitTsDeclarations: true,
			// The language is never part of the URL: a choice made with the switch (cookie), then
			// the browser's `Accept-Language`, then English.
			strategy: ['cookie', 'preferredLanguage', 'baseLocale']
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					setupFiles: ['src/test-setup.ts'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			},
			{
				// Every story renders in a browser as a test, and its `play` function runs.
				extends: true,
				plugins: [storybookTest({ configDir: join(import.meta.dirname, '.storybook') })],
				test: {
					name: 'storybook',
					browser: {
						enabled: true,
						headless: true,
						provider: playwright(),
						instances: [{ browser: 'chromium' }]
					}
				}
			}
		]
	}
});
