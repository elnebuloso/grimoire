import { describe, it, expect } from 'vitest';
import { readSourceFields, toSourceFields } from './source-fields';

describe('toSourceFields', () => {
	const stored = {
		name: 'Auth Service',
		description: 'Login and sessions',
		gitUrl: 'https://gitlab.example.com/platform/auth.git',
		docsUrl: 'https://docs.example.com/auth/',
		branch: 'develop',
		path: 'handbook/',
		exclusions: ['drafts/**', 'old/*.md'],
		schedule: '0 * * * *',
		paused: true,
		visibility: 'internal' as const,
		username: 'deploy'
	};

	it('shows every stored setting, exclusions one per line', () => {
		expect(toSourceFields(stored)).toEqual({
			...stored,
			exclusions: 'drafts/**\nold/*.md'
		});
	});

	it('shows optional settings that are not stored as empty fields', () => {
		const fields = toSourceFields({
			...stored,
			docsUrl: null,
			exclusions: [],
			schedule: null,
			username: null
		});

		expect(fields).toMatchObject({ docsUrl: '', exclusions: '', schedule: '', username: '' });
	});
});

describe('readSourceFields', () => {
	function visibilityOf(value?: string) {
		const data = new FormData();
		if (value !== undefined) data.set('visibility', value);
		return readSourceFields(data).visibility;
	}

	it('reads each visibility level', () => {
		expect([visibilityOf('internal'), visibilityOf('public')]).toEqual(['internal', 'public']);
	});

	it('reads a missing or unknown level as internal', () => {
		expect([visibilityOf(), visibilityOf('private')]).toEqual(['internal', 'internal']);
	});
});
