import type { DatabaseSync } from 'node:sqlite';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { SYNC_SCHEDULE, TOKEN_ENCRYPTION_KEY, TZ } from '$app/env/private';
import { database } from '#lib/server/db/index.js';
import { log } from '#lib/server/log.js';
import { requestSync } from '#lib/server/sync/index.js';
import { redactUrl } from '#lib/server/sync/git.js';
import { nextRun } from '#lib/server/sync/schedule.js';
import { decryptToken, encryptToken } from '#lib/server/token-encryption.js';
import { accessChanged, checkSourceAccess } from '#lib/server/admin/source-access.js';
import {
	changeSourceSlug,
	deleteSource,
	findProject,
	findSource,
	parseIdParam,
	saveSource,
	sourceProblem,
	type SourceForm,
	type Project,
	type SourceSettings
} from '#lib/server/admin/projects.js';
import { previewPage, sourceStatus } from '#lib/server/admin/status.js';
import { readSettings } from '#lib/server/settings.js';

function pageFor(params: { id: string; sourceId: string }): {
	project: Project;
	source: SourceSettings | undefined;
} {
	const projectId = parseIdParam(params.id);
	const project = typeof projectId === 'number' ? findProject(database(), projectId) : undefined;
	if (!project) error(404);
	const sourceId = parseIdParam(params.sourceId);
	if (sourceId === 'new') return { project, source: undefined };
	const source = sourceId && findSource(database(), project.id, sourceId);
	if (!source) error(404);
	return { project, source };
}

export const load: PageServerLoad = ({ params, url }) => {
	const { project, source } = pageFor(params);
	const schedule = source?.schedule ?? SYNC_SCHEDULE;
	const previewFile = url.searchParams.get('preview');
	const { syncsPaused } = readSettings(database());
	return {
		project,
		source,
		status: source && sourceStatus(database(), source.id),
		preview:
			source && previewFile
				? {
						file: previewFile,
						markdown: previewPage(database(), project.slug, source.slug, previewFile)
					}
				: undefined,
		globalSchedule: SYNC_SCHEDULE,
		syncsPaused,
		nextCheck:
			source?.paused || syncsPaused ? undefined : nextRun(schedule, new Date(), TZ)?.toISOString()
	};
};

/**
 * The form as sent, and the values to send back into it. Secrets are not sent back, not even into
 * the form they came from: an entered token returns only encrypted, so a test or a rejected save
 * keeps it without the page ever holding it in plain text.
 */
function readSourceForm(data: FormData) {
	const field = (name: string) => String(data.get(name) ?? '');
	const enteredToken = field('token').trim();
	const encryptedToken = enteredToken
		? encryptToken(enteredToken, TOKEN_ENCRYPTION_KEY)
		: field('encryptedToken');
	const form: SourceForm = {
		name: field('name'),
		gitUrl: field('gitUrl'),
		docsUrl: field('docsUrl'),
		branch: field('branch'),
		path: field('path'),
		exclusions: field('exclusions'),
		schedule: field('schedule'),
		paused: data.get('paused') === 'on',
		username: field('username'),
		token: encryptedToken ? decryptToken(encryptedToken, TOKEN_ENCRYPTION_KEY) : '',
		removeToken: data.get('removeToken') === 'on'
	};
	const values = {
		name: form.name,
		gitUrl: redactUrl(form.gitUrl),
		docsUrl: form.docsUrl,
		branch: form.branch,
		path: form.path,
		exclusions: form.exclusions,
		schedule: form.schedule,
		paused: form.paused,
		username: form.username,
		removeToken: form.removeToken,
		encryptedToken
	};
	return { form, values };
}

async function accessProblem(
	db: DatabaseSync,
	sourceId: number | undefined,
	form: SourceForm
): Promise<string | undefined> {
	const access = await checkSourceAccess(db, TOKEN_ENCRYPTION_KEY, sourceId, form);
	return access.ok ? undefined : access.message;
}

export const actions = {
	save: async ({ request, params }) => {
		const { project, source } = pageFor(params);
		const { form, values } = readSourceForm(await request.formData());
		const db = database();
		const problem =
			sourceProblem(db, project.id, source?.id, form) ??
			(accessChanged(db, source?.id, form) ? await accessProblem(db, source?.id, form) : undefined);
		if (problem) return fail(400, { error: problem, values });

		const result = saveSource(db, TOKEN_ENCRYPTION_KEY, project.id, source?.id, form);
		if ('error' in result) return fail(400, { error: result.error, values });

		// Forced, so a changed path or exclusions take effect without waiting for a new commit.
		if (!form.paused && !readSettings(db).syncsPaused) {
			requestSync(result.id, { force: true }).catch((error: Error) => {
				log.error({ err: error }, `sync of source ${result.id} failed`);
			});
		}
		redirect(303, `/admin/projects/${project.id}/sources/${result.id}`);
	},
	test: async ({ request, params }) => {
		const { source } = pageFor(params);
		const { form, values } = readSourceForm(await request.formData());
		const access = await checkSourceAccess(database(), TOKEN_ENCRYPTION_KEY, source?.id, form);
		return { access, values };
	},
	sync: async ({ params }) => {
		const { source } = pageFor(params);
		if (!source) error(404);
		return { sync: await requestSync(source.id, { force: true }) };
	},
	slug: async ({ request, params }) => {
		const { project, source } = pageFor(params);
		if (!source) error(404);
		const data = await request.formData();
		const form = {
			slug: String(data.get('slug') ?? ''),
			confirmation: String(data.get('confirmation') ?? '')
		};
		const problem = changeSourceSlug(database(), project.id, source.id, form);
		if (problem) return fail(400, { slugError: problem, slugValues: { slug: form.slug } });

		// Stored links carry IDs with the old slug until the source is indexed again, paused or not.
		requestSync(source.id, { force: true }).catch((error: Error) => {
			log.error({ err: error }, `sync of source ${source.id} failed`);
		});
		return { slugChanged: true };
	},
	delete: ({ params }) => {
		const { project, source } = pageFor(params);
		if (source) deleteSource(database(), project.id, source.id);
		redirect(303, `/admin/projects/${project.id}`);
	}
} satisfies Actions;
