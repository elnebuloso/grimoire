import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import {
	changeProjectSlug,
	deleteProject,
	findProject,
	listSources,
	parseIdParam,
	saveProject,
	type Project
} from '#lib/server/admin/projects.js';
import { sourceHealth } from '#lib/server/admin/status.js';

// `/manage/projects/new` is the wizard's own route.
function projectFor(param: string): Project {
	const id = parseIdParam(param);
	const project = typeof id === 'number' ? findProject(database(), id) : undefined;
	if (!project) error(404);
	return project;
}

export const load: PageServerLoad = ({ params }) => {
	const project = projectFor(params.id);
	const health = new Map(sourceHealth(database(), project.id).map((h) => [h.sourceId, h]));
	return {
		project,
		sources: listSources(database(), project.id).map((source) => ({
			...source,
			health: health.get(source.id)!
		}))
	};
};

export const actions = {
	save: async ({ request, params }) => {
		const data = await request.formData();
		const form = {
			name: String(data.get('name') ?? ''),
			description: String(data.get('description') ?? '')
		};
		const result = saveProject(database(), projectFor(params.id).id, form);
		if ('error' in result) return fail(400, { error: result.error, values: form });
		redirect(303, `/manage/projects/${result.id}`);
	},
	slug: async ({ request, params }) => {
		const project = projectFor(params.id);
		const data = await request.formData();
		const form = {
			slug: String(data.get('slug') ?? ''),
			confirmation: String(data.get('confirmation') ?? '')
		};
		const changed = changeProjectSlug(database(), project.id, form);
		if (changed === 'not-found') error(404);
		if ('error' in changed) {
			return fail(400, { slugError: changed.error, slugValues: { slug: form.slug } });
		}
		return { slugChanged: true };
	},
	delete: ({ params }) => {
		deleteProject(database(), projectFor(params.id).id);
		redirect(303, '/manage');
	}
} satisfies Actions;
