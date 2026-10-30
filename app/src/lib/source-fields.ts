/** The settings of a source as the source page sends them. */
export interface SourceFields {
	name: string;
	description: string;
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
	description: '',
	gitUrl: '',
	docsUrl: '',
	branch: 'main',
	path: 'docs/',
	exclusions: '',
	schedule: '',
	paused: false,
	username: ''
};

/** The same settings as stored: optional ones are null rather than empty, exclusions a list. */
export interface StoredSourceFields {
	name: string;
	description: string;
	gitUrl: string;
	/** Where the documentation is published as a site; null when not given. */
	docsUrl: string | null;
	branch: string;
	path: string;
	exclusions: string[];
	schedule: string | null;
	paused: boolean;
	username: string | null;
}

/** The form fields that show a stored source. */
export function toSourceFields(source: StoredSourceFields): SourceFields {
	return {
		name: source.name,
		description: source.description,
		gitUrl: source.gitUrl,
		docsUrl: source.docsUrl ?? '',
		branch: source.branch,
		path: source.path,
		exclusions: source.exclusions.join('\n'),
		schedule: source.schedule ?? '',
		paused: source.paused,
		username: source.username ?? ''
	};
}

export function readSourceFields(data: FormData): SourceFields {
	const field = (name: string) => String(data.get(name) ?? '');
	return {
		name: field('name'),
		description: field('description'),
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
