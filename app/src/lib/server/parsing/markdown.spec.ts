import { describe, it, expect } from 'vitest';
import { splitCode } from './markdown';

describe('splitCode', () => {
	it('separates code blocks from prose', () => {
		expect(splitCode('Roll back:\n\n```bash\nmake rollback\n```\n\nThen `check`.\n')).toEqual({
			text: 'Roll back:\nThen check.',
			code: 'make rollback'
		});
	});
});
