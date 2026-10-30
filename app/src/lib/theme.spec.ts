import { describe, expect, it } from 'vitest';
import { themeAttribute } from './theme';

describe('themeAttribute', () => {
	it('sets the picked scheme on the page', () => {
		expect(themeAttribute('light')).toBe('data-theme="light"');
		expect(themeAttribute('dark')).toBe('data-theme="dark"');
	});

	it.each([undefined, '', 'system', 'dark" onload="alert(1)'])(
		'leaves the page to follow the system for %j',
		(cookie) => {
			expect(themeAttribute(cookie)).toBe('');
		}
	);
});
