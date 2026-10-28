import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { createApiKey, listApiKeys, revokeApiKey } from '#lib/server/api-keys.js';
import { listProjects } from '#lib/server/admin/projects.js';

export const load: PageServerLoad = () => ({
	keys: listApiKeys(database()),
	projects: listProjects(database()).map((project) => project.slug)
});

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		const allProjects = data.get('scope') === 'all';
		const projects = data.getAll('projects').map(String);
		const values = { name, allProjects, projects };

		if (!name) return fail(400, { error: 'Enter a name.', values });
		if (!allProjects && projects.length === 0) {
			return fail(400, { error: 'Choose all projects or at least one.', values });
		}
		try {
			const { key } = createApiKey(database(), name, allProjects ? 'all' : projects);
			return { created: { name, key } };
		} catch (error) {
			// A project deleted while the form was open.
			return fail(400, { error: (error as Error).message, values });
		}
	},
	revoke: async ({ request }) => {
		const id = Number((await request.formData()).get('id'));
		revokeApiKey(database(), id);
	}
} satisfies Actions;
