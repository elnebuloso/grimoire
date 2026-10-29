import { describe, it, expect } from 'vitest';
import { extensionSettings, findSiteConfig, navOrder } from './site-config';

function reader(files: Record<string, string>) {
	return (path: string) => files[path];
}

describe('findSiteConfig', () => {
	it('finds the config in a directory above the source path', () => {
		const config = findSiteConfig(
			'services/auth/docs',
			reader({ 'services/auth/mkdocs.yml': 'site_name: Auth\n' })
		);
		expect(config).toEqual({ file: 'services/auth/mkdocs.yml', settings: { site_name: 'Auth' } });
	});

	it('prefers zensical.toml and reads its [project] table', () => {
		const config = findSiteConfig(
			'docs',
			reader({
				'mkdocs.yml': 'site_name: Old\n',
				'zensical.toml': '[project]\nsite_name = "New"\n'
			})
		);
		expect(config).toEqual({ file: 'zensical.toml', settings: { site_name: 'New' } });
	});

	it('reads a mkdocs.yml with Python tags', () => {
		const yaml =
			'nav:\n  - index.md\nmarkdown_extensions:\n  - pymdownx.emoji:\n      emoji_index: !!python/name:material.extensions.emoji.twemoji\n';
		expect(findSiteConfig('.', reader({ 'mkdocs.yml': yaml }))?.settings.nav).toEqual(['index.md']);
	});

	it('returns undefined without a config and throws on one it cannot parse', () => {
		expect(findSiteConfig('docs', reader({}))).toBeUndefined();
		expect(() => findSiteConfig('docs', reader({ 'zensical.toml': '[project\n' }))).toThrow(
			/^cannot parse zensical.toml: /
		);
	});
});

describe('navOrder', () => {
	it('flattens titled entries and sections, relative to the source path', () => {
		const config = {
			file: 'mkdocs.yml',
			settings: {
				nav: [
					'index.md',
					{ Guide: [{ Start: 'guide/start.md' }, 'guide/deploy.md'] },
					{ Blog: 'https://example.com/blog' },
					{ Again: 'index.md' }
				]
			}
		};
		expect(navOrder(config, 'docs/')).toEqual(['index.md', 'guide/start.md', 'guide/deploy.md']);
	});

	it('resolves entries against docs_dir next to the config and drops those outside the source', () => {
		const config = {
			file: 'services/auth/zensical.toml',
			settings: { docs_dir: 'handbook', nav: ['index.md', 'api/keys.md'] }
		};
		expect(navOrder(config, 'services/auth/handbook/api')).toEqual(['keys.md']);
		expect(navOrder(config, '.')).toEqual([
			'services/auth/handbook/index.md',
			'services/auth/handbook/api/keys.md'
		]);
	});

	it('returns undefined when the config has no nav', () => {
		expect(navOrder({ file: 'mkdocs.yml', settings: {} }, 'docs')).toBeUndefined();
	});
});

describe('extensionSettings', () => {
	it('finds the options of an extension in the list of mkdocs.yml', () => {
		const yaml =
			'markdown_extensions:\n  - admonition\n  - pymdownx.snippets:\n      url_download: true\n';
		const config = findSiteConfig('.', (path) => (path === 'mkdocs.yml' ? yaml : undefined))!;
		expect(extensionSettings(config.settings, 'pymdownx.snippets')).toEqual({ url_download: true });
	});

	it('finds them in zensical.toml, where TOML nests the dotted name', () => {
		const toml = '[project.markdown_extensions.pymdownx.snippets]\nurl_download = true\n';
		const config = findSiteConfig('.', (path) => (path === 'zensical.toml' ? toml : undefined))!;
		expect(extensionSettings(config.settings, 'pymdownx.snippets')).toEqual({ url_download: true });
	});

	it('is empty for an extension the site does not configure', () => {
		expect(extensionSettings({ markdown_extensions: ['admonition'] }, 'pymdownx.snippets')).toEqual(
			{}
		);
		expect(extensionSettings({}, 'toc')).toEqual({});
	});
});
