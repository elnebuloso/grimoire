import { describe, it, expect } from 'vitest';
import { findSiteConfig } from './site-config';
import { configuredSlugify, pymdownxSlugify, pythonMarkdownSlugify, type Slugify } from './slugs';

// Expected values come from Python-Markdown 3 and pymdown-extensions 12.3 run on the same texts.
const TEXTS = [
	'Hello World',
	'Über Größe café',
	'C++ & Rust: 2024!',
	'Straße  im Ärger_Fall',
	'Ελληνικά Κείμενο',
	'Already-Dashed -- Title'
];

const cases: [string, Slugify, string[]][] = [
	[
		'toc.slugify',
		(text) => pythonMarkdownSlugify(text),
		[
			'hello-world',
			'uber-groe-cafe',
			'c-rust-2024',
			'strae-im-arger_fall',
			'',
			'already-dashed-title'
		]
	],
	[
		'toc.slugify with separator _',
		(text) => pythonMarkdownSlugify(text, '_'),
		[
			'hello_world',
			'uber_groe_cafe',
			'c_rust_2024',
			'strae_im_arger_fall',
			'',
			'already-dashed_--_title'
		]
	],
	[
		'toc.slugify_unicode',
		(text) => pythonMarkdownSlugify(text, '-', true),
		[
			'hello-world',
			'über-größe-café',
			'c-rust-2024',
			'straße-im-ärger_fall',
			'ελληνικά-κείμενο',
			'already-dashed-title'
		]
	],
	[
		'pymdownx.slugs.slugify',
		pymdownxSlugify({}),
		[
			'Hello-World',
			'Über-Größe-café',
			'C--Rust-2024',
			'Straße--im-Ärger_Fall',
			'Ελληνικά-Κείμενο',
			'Already-Dashed----Title'
		]
	],
	[
		'pymdownx.slugs.slugify case lower',
		pymdownxSlugify({ case: 'lower' }),
		[
			'hello-world',
			'über-größe-café',
			'c--rust-2024',
			'straße--im-ärger_fall',
			'ελληνικά-κείμενο',
			'already-dashed----title'
		]
	],
	[
		'pymdownx.slugs.slugify case lower-ascii',
		pymdownxSlugify({ case: 'lower-ascii' }),
		[
			'hello-world',
			'Über-größe-café',
			'c--rust-2024',
			'straße--im-Ärger_fall',
			'Ελληνικά-Κείμενο',
			'already-dashed----title'
		]
	],
	[
		'pymdownx.slugs.slugify case fold',
		pymdownxSlugify({ case: 'fold' }),
		[
			'hello-world',
			'über-grösse-café',
			'c--rust-2024',
			'strasse--im-ärger_fall',
			'ελληνικά-κείμενο',
			'already-dashed----title'
		]
	],
	[
		'pymdownx.slugs.slugify percent_encode',
		pymdownxSlugify({ case: 'lower', percent_encode: true }),
		[
			'hello-world',
			'%C3%BCber-gr%C3%B6%C3%9Fe-caf%C3%A9',
			'c--rust-2024',
			'stra%C3%9Fe--im-%C3%A4rger_fall',
			'%CE%B5%CE%BB%CE%BB%CE%B7%CE%BD%CE%B9%CE%BA%CE%AC-%CE%BA%CE%B5%CE%AF%CE%BC%CE%B5%CE%BD%CE%BF',
			'already-dashed----title'
		]
	],
	[
		'pymdownx.slugs.slugify normalize NFD',
		pymdownxSlugify({ case: 'lower', normalize: 'NFD' }),
		[
			'hello-world',
			'uber-große-cafe',
			'c--rust-2024',
			'straße--im-arger_fall',
			'ελληνικα-κειμενο',
			'already-dashed----title'
		]
	]
];

describe('slug functions', () => {
	it.each(cases)('%s matches the Python implementation', (_, slugify, expected) => {
		expect(TEXTS.map(slugify)).toEqual(expected);
	});
});

describe('configuredSlugify', () => {
	function fromMkdocs(yaml: string) {
		return configuredSlugify(
			findSiteConfig('.', (path) => (path === 'mkdocs.yml' ? yaml : undefined))!.settings
		);
	}

	it('applies pymdownx.slugs.slugify with its options from mkdocs.yml', () => {
		const { slugify, warning } = fromMkdocs(
			'markdown_extensions:\n  - admonition\n  - toc:\n      slugify: !!python/object/apply:pymdownx.slugs.slugify\n        kwds:\n          case: lower\n'
		);
		expect(slugify('Über Größe')).toBe('über-größe');
		expect(warning).toBeUndefined();
	});

	it('applies a slug function named with !!python/name and the separator', () => {
		const { slugify } = fromMkdocs(
			'markdown_extensions:\n  - toc:\n      separator: _\n      slugify: !!python/name:markdown.extensions.toc.slugify_unicode\n'
		);
		expect(slugify('Über Größe')).toBe('über_größe');
	});

	it('applies the slugify table of zensical.toml', () => {
		const toml =
			'[project.markdown_extensions.toc]\nslugify = { object = "pymdownx.slugs.slugify", kwds = { case = "fold" } }\n';
		const config = findSiteConfig('.', (path) => (path === 'zensical.toml' ? toml : undefined))!;
		expect(configuredSlugify(config.settings).slugify('Straße')).toBe('strasse');
	});

	it('keeps the default without a toc slugify', () => {
		const { slugify, warning } = configuredSlugify({ markdown_extensions: ['toc'] });
		expect(slugify('Über Größe')).toBe('uber-groe');
		expect(warning).toBeUndefined();
	});

	it('falls back to the default with a warning for an unknown slug function', () => {
		const { slugify, warning } = fromMkdocs(
			'markdown_extensions:\n  - toc:\n      slugify: !!python/name:my_site.slugs.custom\n'
		);
		expect(slugify('Über Größe')).toBe('uber-groe');
		expect(warning).toBe(
			'toc slugify "my_site.slugs.custom" is not supported, heading IDs use the default'
		);
	});
});
