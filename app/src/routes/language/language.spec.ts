import { describe, it, expect } from 'vitest';
import { isRedirect } from '@sveltejs/kit';
import { POST } from './+server';

async function redirectFor(redirectTo: string): Promise<string> {
	const url = new URL('https://grimoire.example/language');
	const request = new Request(url, { method: 'POST', body: new URLSearchParams({ redirectTo }) });
	try {
		await POST({ request, url, cookies: { set: () => {} } } as never);
	} catch (error) {
		if (isRedirect(error)) return error.location;
		throw error;
	}
	throw new Error('no redirect');
}

describe('POST /language', () => {
	it('goes back to a path on this site, with its query and anchor', async () => {
		expect(await redirectFor('/manage/projects?page=2#top')).toBe('/manage/projects?page=2#top');
	});

	it.each([
		'/\t/evil.example',
		'//evil.example',
		'/\\evil.example',
		'https://evil.example/',
		'javascript:alert(1)',
		'/.//evil.example',
		'/a/..//evil.example',
		'http://[x'
	])('goes to the start page instead of another site: %j', async (target) => {
		expect(await redirectFor(target)).toBe('/');
	});
});
