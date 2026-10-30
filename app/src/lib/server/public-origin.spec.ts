import { describe, it, expect, vi } from 'vitest';
import { captureLog } from './capture-log';
import { createPublicOrigin } from './public-origin';

vi.mock('$app/env/private', () => ({ BASE_URL: '' }));

const REQUEST = new URL('http://grimoire:3000/p/platform/llms.txt');

describe('createPublicOrigin', () => {
	it('uses the origin of the request without a base URL', () => {
		const log = captureLog();

		expect(createPublicOrigin('')(REQUEST)).toBe('http://grimoire:3000');
		expect(log.lines()).toEqual([]);
	});

	it('uses the base URL whatever host the request named', () => {
		expect(createPublicOrigin('https://grimoire.example.com')(REQUEST)).toBe(
			'https://grimoire.example.com'
		);
	});

	it('warns once when requests arrive at another origin than the base URL', () => {
		const log = captureLog();
		const publicOrigin = createPublicOrigin('https://grimoire.example.com');

		publicOrigin(REQUEST);
		publicOrigin(new URL('http://10.0.0.7:3000/'));

		expect(log.lines()).toMatchObject([
			{
				'log.level': 'warn',
				message:
					'A request arrived at http://grimoire:3000, but BASE_URL is https://grimoire.example.com; links point to BASE_URL'
			}
		]);
	});

	it('stays quiet when requests arrive at the base URL', () => {
		const log = captureLog();

		createPublicOrigin('https://grimoire.example.com')(new URL('https://grimoire.example.com/'));

		expect(log.lines()).toEqual([]);
	});
});
