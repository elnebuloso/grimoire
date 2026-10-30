import { describe, expect, it } from 'vitest';
import { errorTitles } from './error-titles';

describe('errorTitles', () => {
	it('names a missing page', () => {
		expect(errorTitles(404)).toEqual({
			heading: 'This page does not exist.',
			documentTitle: 'Page not found'
		});
	});

	it('names a page the visitor may not open', () => {
		expect(errorTitles(403)).toEqual({
			heading: 'You may not open this page.',
			documentTitle: 'Access denied'
		});
	});

	it.each([500, 400, 503])('names any other status %i as an unexpected error', (status) => {
		expect(errorTitles(status)).toEqual({
			heading: 'Something went wrong. Try again later.',
			documentTitle: 'Error'
		});
	});
});
