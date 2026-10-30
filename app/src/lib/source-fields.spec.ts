import { describe, it, expect } from 'vitest';
import {
	hiddenSourceFields,
	readSourceFields,
	toSourceFields,
	type SourceFields
} from './source-fields';

function carried(fields: SourceFields): SourceFields {
	const data = new FormData();
	for (const [name, value] of hiddenSourceFields(fields)) data.append(name, value);
	return readSourceFields(data);
}

describe('hiddenSourceFields', () => {
	it('carries every field through a step unchanged', () => {
		const fields: SourceFields = {
			name: 'Auth Service',
			gitUrl: 'https://gitlab.example.com/platform/auth.git',
			docsUrl: 'https://docs.example.com/auth/',
			branch: 'develop',
			path: 'handbook/',
			exclusions: 'drafts/**\nold/*.md',
			schedule: '0 * * * *',
			paused: true,
			username: 'deploy'
		};

		expect(carried(fields)).toEqual(fields);
		expect(carried({ ...fields, paused: false })).toEqual({ ...fields, paused: false });
	});
});

describe('toSourceFields', () => {
	const stored = {
		name: 'Auth Service',
		gitUrl: 'https://gitlab.example.com/platform/auth.git',
		docsUrl: 'https://docs.example.com/auth/',
		branch: 'develop',
		path: 'handbook/',
		exclusions: ['drafts/**', 'old/*.md'],
		schedule: '0 * * * *',
		paused: true,
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
