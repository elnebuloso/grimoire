import { describe, it, expect } from 'vitest';
import { isSlug, MAX_SLUG_LENGTH, slugify } from './slug';

describe('slugify', () => {
	it.each([
		['Platform', 'platform'],
		['Auth Service', 'auth-service'],
		['Prüfung & Abnahme', 'pruefung-abnahme'],
		['Größe', 'groesse'],
		['Café Résumé', 'cafe-resume'],
		['  --Billing__API v2!--  ', 'billing-api-v2'],
		['ÄÖÜ', 'aeoeue'],
		['日本語', ''],
		['!!!', '']
	])('turns "%s" into "%s"', (name, slug) => {
		expect(slugify(name)).toBe(slug);
	});

	it('cuts a long name at a hyphen', () => {
		const slug = slugify('Platform authentication service for every internal team');

		expect(slug).toBe('platform-authentication-service-for');
		expect(slug.length).toBeLessThanOrEqual(MAX_SLUG_LENGTH);
	});

	it('cuts a long name without hyphens at the maximum length', () => {
		expect(slugify('a'.repeat(60))).toBe('a'.repeat(MAX_SLUG_LENGTH));
	});

	it('keeps a hyphen right after the maximum length from cutting a word short', () => {
		const name = `${'a'.repeat(MAX_SLUG_LENGTH)} rest`;

		expect(slugify(name)).toBe('a'.repeat(MAX_SLUG_LENGTH));
	});
});

describe('isSlug', () => {
	it.each(['platform', 'auth-service', 'v2', 'a'.repeat(MAX_SLUG_LENGTH)])(
		'accepts "%s"',
		(slug) => {
			expect(isSlug(slug)).toBe(true);
		}
	);

	it.each(['', 'Platform', 'auth--service', '-auth', 'auth-', 'a b', 'ä', 'a'.repeat(41)])(
		'rejects "%s"',
		(slug) => {
			expect(isSlug(slug)).toBe(false);
		}
	);
});
