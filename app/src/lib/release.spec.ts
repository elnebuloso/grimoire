import { describe, expect, it } from 'vitest';
import { releaseNotesUrl } from './release';

describe('releaseNotesUrl', () => {
	it('links a release to the notes of its tag', () => {
		expect(releaseNotesUrl('1.2.3')).toBe(
			'https://github.com/elnebuloso/grimoire/releases/tag/v1.2.3'
		);
	});

	it('has no notes for the development version', () => {
		expect(releaseNotesUrl('0.0.0')).toBeUndefined();
	});
});
