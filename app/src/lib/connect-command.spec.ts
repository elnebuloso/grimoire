import { describe, it, expect } from 'vitest';
import { connectCommand } from './connect-command';

describe('connectCommand', () => {
	it('sends the key in a header', () => {
		expect(connectCommand('https://docs.example.com', 'acme-docs', 'grimoire_abc')).toBe(
			[
				'claude mcp add \\',
				'  --transport http \\',
				'  --scope user \\',
				'  acme-docs \\',
				'  https://docs.example.com/mcp \\',
				'  --header "Authorization: Bearer grimoire_abc"'
			].join('\n')
		);
	});

	it('connects without a header when there is no key', () => {
		expect(connectCommand('https://docs.example.com', 'acme-docs', null)).toMatch(
			/ {2}acme-docs \\\n {2}https:\/\/docs\.example\.com\/mcp$/
		);
	});
});
