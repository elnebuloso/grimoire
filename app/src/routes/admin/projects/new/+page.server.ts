import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { SYNC_SCHEDULE, TOKEN_ENCRYPTION_KEY } from '$app/env/private';
import { database } from '#lib/server/db/index.js';
import { requestSync } from '#lib/server/sync/index.js';
import { redactUrl } from '#lib/server/sync/git.js';
import { decryptToken, encryptToken } from '#lib/server/token-encryption.js';
import {
	createProjectWithSource,
	projectProblem,
	sourceProblem,
	type ProjectForm,
	type SourceForm
} from '#lib/server/admin/projects.js';

export type Step = 'project' | 'source' | 'summary';

/** Everything entered so far; the token only encrypted, so the page never holds it in plain text. */
export interface WizardValues {
	project: ProjectForm;
	source: Omit<SourceForm, 'token' | 'removeToken'>;
	encryptedToken: string;
}

export const load: PageServerLoad = () => ({ globalSchedule: SYNC_SCHEDULE });

function readValues(data: FormData): WizardValues {
	const field = (name: string) => String(data.get(name) ?? '');
	return {
		project: { slug: field('projectSlug'), description: field('description') },
		source: {
			slug: field('sourceSlug'),
			gitUrl: field('gitUrl'),
			branch: field('branch'),
			path: field('path'),
			exclusions: field('exclusions'),
			schedule: field('schedule'),
			paused: data.get('paused') === 'on',
			username: field('username')
		},
		encryptedToken: field('encryptedToken')
	};
}

/** Takes a newly entered token, or drops the carried one when asked to. */
function withToken(values: WizardValues, data: FormData): WizardValues {
	const token = String(data.get('token') ?? '').trim();
	if (token) return { ...values, encryptedToken: encryptToken(token, TOKEN_ENCRYPTION_KEY) };
	if (data.get('removeToken') === 'on') return { ...values, encryptedToken: '' };
	return values;
}

function sourceForm(values: WizardValues): SourceForm {
	const token = values.encryptedToken
		? decryptToken(values.encryptedToken, TOKEN_ENCRYPTION_KEY)
		: '';
	return { ...values.source, token, removeToken: false };
}

/** The first step that is not valid, with its problem; undefined when every step is. */
function firstProblem(values: WizardValues): { step: Step; error: string } | undefined {
	const db = database();
	const project = projectProblem(db, undefined, values.project);
	if (project) return { step: 'project', error: project };
	const source = sourceProblem(db, undefined, undefined, sourceForm(values));
	if (source) return { step: 'source', error: source };
	return undefined;
}

function show(step: Step, values: WizardValues) {
	return { step, values };
}

function reject(problem: { step: Step; error: string }, values: WizardValues) {
	// A Git URL with credentials is rejected, and is not sent back with them either.
	const source = { ...values.source, gitUrl: redactUrl(values.source.gitUrl) };
	return fail(400, { ...problem, values: { ...values, source } });
}

export const actions = {
	project: async ({ request }) => {
		const data = await request.formData();
		return show('project', withToken(readValues(data), data));
	},
	source: async ({ request }) => {
		const data = await request.formData();
		const values = withToken(readValues(data), data);
		const problem = projectProblem(database(), undefined, values.project);
		if (problem) return reject({ step: 'project', error: problem }, values);
		return show('source', values);
	},
	summary: async ({ request }) => {
		const data = await request.formData();
		const values = withToken(readValues(data), data);
		const problem = firstProblem(values);
		if (problem) return reject(problem, values);
		return show('summary', values);
	},
	create: async ({ request }) => {
		const values = readValues(await request.formData());
		const result = createProjectWithSource(
			database(),
			TOKEN_ENCRYPTION_KEY,
			values.project,
			sourceForm(values)
		);
		// Somebody took the slug since the summary was shown: back to the step it belongs to.
		if ('error' in result)
			return reject(firstProblem(values) ?? { step: 'summary', ...result }, values);

		if (!values.source.paused) {
			requestSync(result.sourceId, { force: true }).catch((error: Error) => {
				console.error(`sync of source ${result.sourceId} failed: ${error.message}`);
			});
		}
		redirect(303, `/admin/projects/${result.projectId}`);
	}
} satisfies Actions;
