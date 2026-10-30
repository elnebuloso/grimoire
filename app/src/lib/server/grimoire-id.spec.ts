import { describe, it, expect } from 'vitest';
import { grimoireId, parseGrimoireId, storedLink, withSlug } from './grimoire-id';

const page = { source: 'platform-docs', file: 'guides/setup.md' };

describe('grimoireId', () => {
	it('names a page by its file without .md', () => {
		expect(grimoireId(page)).toBe('platform-docs/guides/setup');
	});

	it('appends the anchor of a section', () => {
		expect(grimoireId(page, 'install')).toBe('platform-docs/guides/setup#install');
	});

	it('names the page for an empty or missing anchor', () => {
		expect(grimoireId(page, null)).toBe('platform-docs/guides/setup');
		expect(grimoireId(page, '')).toBe('platform-docs/guides/setup');
	});
});

describe('parseGrimoireId', () => {
	it('reads back what grimoireId builds', () => {
		expect(parseGrimoireId(grimoireId(page, 'install'))).toEqual({ ...page, anchor: 'install' });
		expect(parseGrimoireId(grimoireId(page))).toEqual({ ...page, anchor: undefined });
	});

	it('reads a page at the top of the source', () => {
		expect(parseGrimoireId('platform-docs/index')).toMatchObject({ file: 'index.md' });
	});

	it('names no page without a page part', () => {
		expect(parseGrimoireId('platform-docs')).toBeUndefined();
		expect(parseGrimoireId('platform-docs#install')).toBeUndefined();
	});
});

describe('withSlug', () => {
	it('turns every form of a stored link into a full ID', () => {
		const stored = [
			`[a](${storedLink('guide#x')})`,
			`[b](<${storedLink('first steps')}>)`,
			`[c]: ${storedLink('deploy')}`,
			`<${storedLink('index')}>`
		].join('\n');

		expect(withSlug(stored, 'platform-docs')).toBe(
			[
				'[a](platform-docs/guide#x)',
				'[b](<platform-docs/first steps>)',
				'[c]: platform-docs/deploy',
				'<platform-docs/index>'
			].join('\n')
		);
	});

	it('leaves the scheme alone where it is no link destination', () => {
		const text = 'Run `grimoire:sync` or write grimoire: in a sentence.';

		expect(withSlug(text, 'platform-docs')).toBe(text);
	});
});
