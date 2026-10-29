import { error, fail, redirect } from '@sveltejs/kit';
import { Cron } from 'croner';
import type { Actions, PageServerLoad } from './$types';
import { SYNC_SCHEDULE, TOKEN_ENCRYPTION_KEY } from '$app/env/private';
import { database } from '#lib/server/db/index.js';
import { requestSync } from '#lib/server/sync/index.js';
import { redactUrl } from '#lib/server/sync/git.js';
import {
	changeSourceSlug,
	deleteSource,
	findProject,
	findSource,
	parseIdParam,
	saveSource,
	type Project,
	type SourceSettings
} from '#lib/server/admin/projects.js';
import { previewPage, sourceStatus } from '#lib/server/admin/status.js';

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
		nextCheck: source?.paused
			? undefined
			: new Cron(schedule, { mode: '5-part' }).nextRun()?.toISOString()
	};
};

export const actions = {
	save: async ({ request, params }) => {
		const { project, source } = pageFor(params);
		const data = await request.formData();
		const form = {
			name: String(data.get('name') ?? ''),
			gitUrl: String(data.get('gitUrl') ?? ''),
			branch: String(data.get('branch') ?? ''),
			path: String(data.get('path') ?? ''),
			exclusions: String(data.get('exclusions') ?? ''),
			schedule: String(data.get('schedule') ?? ''),
			paused: data.get('paused') === 'on',
			username: String(data.get('username') ?? ''),
			removeToken: data.get('removeToken') === 'on'
		};
		const token = String(data.get('token') ?? '');
		const result = saveSource(database(), TOKEN_ENCRYPTION_KEY, project.id, source?.id, {
			...form,
			token
		});
		// Secrets are not sent back, not even into the form they came from.
		if ('error' in result) {
			return fail(400, {
				error: result.error,
				values: { ...form, gitUrl: redactUrl(form.gitUrl) }
			});
		}

		// Forced, so a changed path or exclusions take effect without waiting for a new commit.
		if (!form.paused) {
			requestSync(result.id, { force: true }).catch((error: Error) => {
				console.error(`sync of source ${result.id} failed: ${error.message}`);
			});
		}
		redirect(303, `/admin/projects/${project.id}/sources/${result.id}`);
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
			console.error(`sync of source ${source.id} failed: ${error.message}`);
		});
		return { slugChanged: true };
	},
	delete: ({ params }) => {
		const { project, source } = pageFor(params);
		if (source) deleteSource(database(), project.id, source.id);
		redirect(303, `/admin/projects/${project.id}`);
	}
} satisfies Actions;
