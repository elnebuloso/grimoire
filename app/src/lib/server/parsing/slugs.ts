import { extensionSettings } from './site-config.ts';
export type Slugify = (text: string) => string;

/** Python-Markdown's `toc.slugify`, the default of MkDocs and Zensical. */
export function pythonMarkdownSlugify(text: string, separator = '-', unicode = false): string {
	const value = unicode ? text : text.normalize('NFKD').replace(/[^\p{ASCII}]/gu, '');
	// Python's `\w` is Unicode-aware: letters, digits and the underscore, but no combining marks.
	return value
		.replace(/[^\p{L}\p{N}_\s-]/gu, '')
		.trim()
		.toLowerCase()
		.replace(new RegExp(`[${escapeClass(separator)}\\s]+`, 'gu'), separator);
}

export interface PymdownxSlugOptions {
	case?: string;
	percent_encode?: boolean;
	normalize?: string;
}

/** `pymdownx.slugs.slugify(**kwds)` from pymdown-extensions. */
export function pymdownxSlugify(options: PymdownxSlugOptions, separator = '-'): Slugify {
	return (text) => {
		let slug = text
			.normalize((options.normalize ?? 'NFC') as 'NFC')
			.replace(/<\/?[^>]*>/g, '')
			.trim();
		if (options.case === 'lower') slug = slug.toLowerCase();
		else if (options.case === 'lower-ascii') slug = slug.replace(/[A-Z]/g, (c) => c.toLowerCase());
		// JavaScript has no `casefold`; upper then lower case folds `ß` to `ss` like Python does.
		else if (options.case === 'fold') slug = slug.toUpperCase().toLowerCase();
		slug = slug.replace(/[^\p{L}\p{N}_\- ]/gu, '').replace(/ /g, separator);
		return options.percent_encode ? encodeURIComponent(slug) : slug;
	};
}

/**
 * The slug function a site configures under the `toc` extension. A function grimoire does not
 * know falls back to the default and comes with a warning.
 */
export function configuredSlugify(settings: Record<string, unknown>): {
	slugify: Slugify;
	warning?: string;
} {
	const toc = extensionSettings(settings, 'toc');
	const separator = typeof toc.separator === 'string' ? toc.separator : '-';
	const fallback = { slugify: (text: string) => pythonMarkdownSlugify(text, separator) };
	const slugify = toc.slugify;
	if (slugify === undefined) return fallback;

	if (isRecord(slugify) && typeof slugify.python_name === 'string') {
		if (slugify.python_name === 'markdown.extensions.toc.slugify') return fallback;
		if (slugify.python_name === 'markdown.extensions.toc.slugify_unicode') {
			return { slugify: (text) => pythonMarkdownSlugify(text, separator, true) };
		}
		return { ...fallback, warning: unknownSlugify(slugify.python_name) };
	}
	if (isRecord(slugify)) {
		const object = typeof slugify.object === 'string' ? slugify.object : 'pymdownx.slugs.slugify';
		if (object !== 'pymdownx.slugs.slugify') {
			return { ...fallback, warning: unknownSlugify(object) };
		}
		const options = isRecord(slugify.kwds) ? slugify.kwds : {};
		const invalid = invalidPymdownxOption(options);
		if (invalid) return { ...fallback, warning: unsupportedOption(invalid) };
		return { slugify: pymdownxSlugify(options, separator) };
	}
	return { ...fallback, warning: unknownSlugify(String(slugify)) };
}

const NORMALIZATION_FORMS = ['NFC', 'NFD', 'NFKC', 'NFKD'];
const CASES = ['none', 'lower', 'lower-ascii', 'fold'];

// An unknown normalization form throws on every heading, which skipped every page; an unknown case
// would build other IDs than the site does.
function invalidPymdownxOption(options: PymdownxSlugOptions): string | undefined {
	if (options.normalize !== undefined && !NORMALIZATION_FORMS.includes(options.normalize)) {
		return `normalize: ${options.normalize}`;
	}
	if (options.case !== undefined && !CASES.includes(options.case)) return `case: ${options.case}`;
	return undefined;
}

function unsupportedOption(option: string): string {
	return `toc slugify option "${option}" is not supported, heading IDs use the default`;
}

function unknownSlugify(name: string): string {
	return `toc slugify "${name}" is not supported, heading IDs use the default`;
}

function escapeClass(text: string): string {
	return text.replace(/[\\\]^-]/g, '\\$&');
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}
