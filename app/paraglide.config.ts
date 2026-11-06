import type { CompilerOptions } from '@inlang/paraglide-js';

/**
 * How the messages are compiled, by the build (`vite.config.ts`) and before type checking
 * (`npm run paraglide`). The language is never part of the URL: a choice made with the switch
 * (cookie), then the browser's `Accept-Language`, then English.
 */
export const paraglideOptions = {
	project: './project.inlang',
	outdir: './src/lib/paraglide',
	emitTsDeclarations: true,
	strategy: ['cookie', 'preferredLanguage', 'baseLocale']
} satisfies CompilerOptions;
