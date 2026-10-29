import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';

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
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
