import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import {
	deleteProject,
	findProject,
	listSources,
	parseIdParam,
	saveProject,
	type Project
} from '#lib/server/admin/projects.js';

// `/admin/projects/new` is the wizard's own route.
function projectFor(param: string): Project {
	const id = parseIdParam(param);
	const project = typeof id === 'number' ? findProject(database(), id) : undefined;
	if (!project) error(404);
	return project;
}

export const load: PageServerLoad = ({ params }) => {
	const project = projectFor(params.id);
	return { project, sources: listSources(database(), project.id) };
};

export const actions = {
	save: async ({ request, params }) => {
		const data = await request.formData();
		const form = {
			slug: String(data.get('slug') ?? ''),
			description: String(data.get('description') ?? '')
		};
		const result = saveProject(database(), projectFor(params.id).id, form);
		if ('error' in result) return fail(400, { error: result.error, values: form });
		redirect(303, `/admin/projects/${result.id}`);
	},
	delete: ({ params }) => {
		deleteProject(database(), projectFor(params.id).id);
		redirect(303, '/admin');
	}
} satisfies Actions;
