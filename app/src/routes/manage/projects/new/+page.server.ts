import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { SYNC_SCHEDULE, TOKEN_ENCRYPTION_KEY } from '$app/env/private';
import { database } from '#lib/server/db/index.js';
import { log } from '#lib/server/log.js';
import { requestSync } from '#lib/server/sync/index.js';
import { redactUrl } from '#lib/server/sync/git.js';
import { checkSourceAccess } from '#lib/server/admin/source-access.js';
import { readFormSecret, SOURCE_TOKEN_FIELDS } from '#lib/server/admin/form-secret.js';
import { m } from '#lib/paraglide/messages.js';
import { readSettings } from '#lib/server/settings.js';
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

/** What the steps sent: the values to send back, and the token in plain text for the checks. */
interface WizardInput {
	values: WizardValues;
	token: string;
	/** The carried token could not be decrypted. */
	damaged: boolean;
}

function readInput(data: FormData): WizardInput {
	const field = (name: string) => String(data.get(name) ?? '');
	const token = readFormSecret(data, TOKEN_ENCRYPTION_KEY, SOURCE_TOKEN_FIELDS);
	const values: WizardValues = {
		project: { name: field('projectName'), description: field('description') },
		source: {
			name: field('sourceName'),
			gitUrl: field('gitUrl'),
			docsUrl: field('docsUrl'),
			branch: field('branch'),
			path: field('path'),
			exclusions: field('exclusions'),
			schedule: field('schedule'),
			paused: data.get('paused') === 'on',
			username: field('username')
		},
		encryptedToken: token.sealed
	};
	return { values, token: token.value, damaged: token.damaged };
}

function sourceForm(input: WizardInput): SourceForm {
	return { ...input.values.source, token: input.token, removeToken: false };
}

/** The first step that is not valid, with its problem; undefined when every step is. */
function firstProblem(input: WizardInput): { step: Step; error: string } | undefined {
	if (input.damaged) return { step: 'source', error: m.error_token_damaged() };
	const db = database();
	const project = projectProblem(db, undefined, input.values.project);
	if (project) return { step: 'project', error: project };
	const source = sourceProblem(db, undefined, undefined, sourceForm(input));
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

/** Whether grimoire can reach the repository of the source step; checked on the way to saving. */
async function accessProblem(
	input: WizardInput
): Promise<{ step: Step; error: string } | undefined> {
	const access = await checkSourceAccess(
		database(),
		TOKEN_ENCRYPTION_KEY,
		undefined,
		sourceForm(input)
	);
	return access.ok ? undefined : { step: 'source', error: access.message };
}

export const actions = {
	project: async ({ request }) => {
		const { values } = readInput(await request.formData());
		return show('project', values);
	},
	source: async ({ request }) => {
		const input = readInput(await request.formData());
		const problem = projectProblem(database(), undefined, input.values.project);
		if (problem) return reject({ step: 'project', error: problem }, input.values);
		return show('source', input.values);
	},
	test: async ({ request }) => {
		const input = readInput(await request.formData());
		if (input.damaged) {
			return reject({ step: 'source', error: m.error_token_damaged() }, input.values);
		}
		const access = await checkSourceAccess(
			database(),
			TOKEN_ENCRYPTION_KEY,
			undefined,
			sourceForm(input)
		);
		return { ...show('source', input.values), access };
	},
	summary: async ({ request }) => {
		const input = readInput(await request.formData());
		const problem = firstProblem(input) ?? (await accessProblem(input));
		if (problem) return reject(problem, input.values);
		return show('summary', input.values);
	},
	create: async ({ request }) => {
		const input = readInput(await request.formData());
		const problem = firstProblem(input) ?? (await accessProblem(input));
		if (problem) return reject(problem, input.values);
		const result = createProjectWithSource(
			database(),
			TOKEN_ENCRYPTION_KEY,
			input.values.project,
			sourceForm(input)
		);
		// Somebody took the slug since the summary was shown: back to the step it belongs to.
		if ('error' in result)
			return reject(firstProblem(input) ?? { step: 'summary', ...result }, input.values);

		if (!input.values.source.paused && !readSettings(database()).syncsPaused) {
			requestSync(result.sourceId, { force: true }).catch((error: Error) => {
				log.error({ err: error }, `sync of source ${result.sourceId} failed`);
			});
		}
		redirect(303, `/manage/projects/${result.projectId}`);
	}
} satisfies Actions;
