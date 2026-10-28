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

function projectFor(param: string): Project | undefined {
	const id = parseIdParam(param);
	if (id === 'new') return undefined;
	const project = id && findProject(database(), id);
	if (!project) error(404);
	return project;
}

export const load: PageServerLoad = ({ params }) => {
	const project = projectFor(params.id);
	return { project, sources: project ? listSources(database(), project.id) : [] };
};

export const actions = {
	save: async ({ request, params }) => {
		const data = await request.formData();
		const form = {
			slug: String(data.get('slug') ?? ''),
			description: String(data.get('description') ?? '')
		};
		const result = saveProject(database(), projectFor(params.id)?.id, form);
		if ('error' in result) return fail(400, { error: result.error, values: form });
		redirect(303, `/admin/projects/${result.id}`);
	},
	delete: ({ params }) => {
		const project = projectFor(params.id);
		if (project) deleteProject(database(), project.id);
		redirect(303, '/admin');
	}
} satisfies Actions;
