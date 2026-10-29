import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { fetchInclude, parseAllowedOrigins } from './url-include';

let server: Server;
let origin: string;

beforeAll(async () => {
	server = createServer((request, response) => {
		if (request.url === '/note.md') return response.end('Shared note.\n');
		if (request.url === '/moved.md') {
			response.writeHead(302, { location: 'http://169.254.169.254/latest/meta-data/' });
			return response.end();
		}
		if (request.url === '/large.md') return response.end('x'.repeat(2000));
		// Never answers, so only the timeout ends the request.
		if (request.url === '/slow.md') return;
		response.writeHead(404).end();
	});
	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
	origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterAll(() => {
	server.closeAllConnections();
	server.close();
});

const limits = { timeoutMs: 200, maxBytes: 1000 };

describe('fetchInclude', () => {
	it('fetches a file from an allowed origin', async () => {
		expect(await fetchInclude(`${origin}/note.md`, [origin], limits)).toEqual({
			content: 'Shared note.\n'
		});
	});

	it('requests nothing from an origin that is not listed', async () => {
		expect(await fetchInclude(`${origin}/note.md`, ['https://docs.example.com'], limits)).toEqual({
			problem: `${origin} is not listed in INCLUDE_URL_ALLOW`
		});
	});

	it('rejects credentials in the URL', async () => {
		const url = `http://user:secret@127.0.0.1:${new URL(origin).port}/note.md`;
		expect(await fetchInclude(url, [origin], limits)).toEqual({
			problem: 'a URL with credentials'
		});
	});

	it('follows no redirect, which could lead to an address nobody allowed', async () => {
		expect(await fetchInclude(`${origin}/moved.md`, [origin], limits)).toEqual({
			problem: 'answered with a redirect (302), which is not followed'
		});
	});

	it('reports an error status, a file too large and a server too slow', async () => {
		expect(await fetchInclude(`${origin}/missing.md`, [origin], limits)).toEqual({
			problem: 'answered with status 404'
		});
		expect(await fetchInclude(`${origin}/large.md`, [origin], limits)).toEqual({
			problem: 'larger than 1000 bytes'
		});
		expect(await fetchInclude(`${origin}/slow.md`, [origin], limits)).toEqual({
			problem: 'no answer within 0.2 seconds'
		});
	});
});

describe('parseAllowedOrigins', () => {
	it('is empty when not set', () => {
		expect(parseAllowedOrigins(undefined)).toEqual([]);
		expect(parseAllowedOrigins('')).toEqual([]);
	});

	it('reads origins separated by commas or spaces', () => {
		expect(
			parseAllowedOrigins('https://docs.example.com, https://raw.githubusercontent.com/')
		).toEqual(['https://docs.example.com', 'https://raw.githubusercontent.com']);
	});

	it.each(['http://docs.example.com', 'https://docs.example.com/team/', 'docs.example.com'])(
		'rejects %s, naming the variable',
		(value) => {
			expect(() => parseAllowedOrigins(value)).toThrow(
				`INCLUDE_URL_ALLOW "${value}" is not an https:// origin`
			);
		}
	);
});
