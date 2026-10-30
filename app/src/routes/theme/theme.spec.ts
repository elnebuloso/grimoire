import { describe, it, expect, vi } from 'vitest';
import { isRedirect } from '@sveltejs/kit';
import { POST } from './+server';
import { THEME_COOKIE } from '#lib/theme.js';

async function pick(fields: Record<string, string>) {
	const url = new URL('https://grimoire.example/theme');
	const request = new Request(url, { method: 'POST', body: new URLSearchParams(fields) });
	const cookies = { set: vi.fn(), delete: vi.fn() };
	try {
		await POST({ request, url, cookies } as never);
	} catch (error) {
		if (isRedirect(error)) return { cookies, location: error.location };
		throw error;
	}
	throw new Error('no redirect');
}

describe('POST /theme', () => {
	it.each(['light', 'dark'])('keeps %s as the picked scheme', async (theme) => {
		const { cookies } = await pick({ theme, redirectTo: '/' });
		expect(cookies.set).toHaveBeenCalledWith(
			THEME_COOKIE,
			theme,
			expect.objectContaining({ path: '/', maxAge: 400 * 24 * 60 * 60 })
		);
		expect(cookies.delete).not.toHaveBeenCalled();
	});

	it('forgets the picked scheme for System, so the page follows the system again', async () => {
		const { cookies } = await pick({ theme: 'system', redirectTo: '/' });
		expect(cookies.delete).toHaveBeenCalledWith(THEME_COOKIE, { path: '/' });
		expect(cookies.set).not.toHaveBeenCalled();
	});

	it('changes nothing for an unknown scheme', async () => {
		const { cookies } = await pick({ theme: 'sepia', redirectTo: '/' });
		expect(cookies.set).not.toHaveBeenCalled();
		expect(cookies.delete).not.toHaveBeenCalled();
	});

	it('goes back to the page on this site, but never to another site', async () => {
		expect((await pick({ theme: 'dark', redirectTo: '/manage?x=1#a' })).location).toBe(
			'/manage?x=1#a'
		);
		expect((await pick({ theme: 'dark', redirectTo: '//evil.example' })).location).toBe('/');
	});
});
