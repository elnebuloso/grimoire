/** The settings of a source as the source page and the project wizard send them. */
export interface SourceFields {
	name: string;
	gitUrl: string;
	/** Empty for none. */
	docsUrl: string;
	branch: string;
	path: string;
	/** One glob pattern per line. */
	exclusions: string;
	schedule: string;
	paused: boolean;
	username: string;
}

export const NEW_SOURCE_FIELDS: SourceFields = {
	name: '',
	gitUrl: '',
	docsUrl: '',
	branch: 'main',
	path: 'docs/',
	exclusions: '',
	schedule: '',
	paused: false,
	username: ''
};

export function readSourceFields(data: FormData): SourceFields {
	const field = (name: string) => String(data.get(name) ?? '');
	return {
		name: field('name'),
		gitUrl: field('gitUrl'),
		docsUrl: field('docsUrl'),
		branch: field('branch'),
		path: field('path'),
		exclusions: field('exclusions'),
		schedule: field('schedule'),
		paused: data.get('paused') === 'on',
		username: field('username')
	};
}

/**
 * The fields as name and value of hidden inputs, for a form step that carries them without
 * showing them; an unchecked checkbox sends nothing.
 */
export function hiddenSourceFields(fields: SourceFields): [name: string, value: string][] {
	return Object.entries(fields)
		.filter(([, value]) => value !== false)
		.map(([name, value]) => [name, value === true ? 'on' : String(value)]);
}
