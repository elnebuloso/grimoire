import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { TZ } from '$app/env/private';
import { database } from '#lib/server/db/index.js';
import {
	createApiKey,
	isExpired,
	listApiKeys,
	revokeApiKey,
	updateApiKey
} from '#lib/server/api-keys.js';
import { listProjects } from '#lib/server/admin/projects.js';
import { m } from '#lib/paraglide/messages.js';
import { dateIn } from '#lib/time-zone.js';

export const load: PageServerLoad = () => {
	const today = dateIn(TZ, new Date());
	return {
		keys: listApiKeys(database()).map((key) => ({
			...key,
			expired: isExpired(key.validUntil, today)
		})),
		projects: listProjects(database()).map((project) => project.slug),
		today
	};
};

/** Scope and expiry as both forms send them, or the message saying what is wrong. */
function readAccess(data: FormData) {
	const allProjects = data.get('scope') === 'all';
	const projects = data.getAll('projects').map(String);
	const validUntil = String(data.get('validUntil') ?? '').trim();
	const values = { allProjects, projects, validUntil };
	if (!allProjects && projects.length === 0) return { values, error: m.apikeys_error_scope() };
	if (validUntil && !isDate(validUntil)) return { values, error: m.apikeys_error_valid_until() };
	if (validUntil && isExpired(validUntil, dateIn(TZ, new Date()))) {
		return { values, error: m.apikeys_error_valid_until_past() };
	}
	return { values };
}

function isDate(value: string): boolean {
	return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

export const actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		const access = readAccess(data);
		const values = { name, ...access.values };

		if (!name) return fail(400, { error: m.apikeys_error_name(), values });
		if (access.error) return fail(400, { error: access.error, values });
		const created = createApiKey(
			database(),
			name,
			values.allProjects ? 'all' : values.projects,
			values.validUntil || null
		);
		// A project deleted while the form was open.
		if ('error' in created) return fail(400, { error: m.apikeys_error_project_gone(), values });
		return { created: { name, key: created.key } };
	},
	update: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		const { values, error: problem } = readAccess(data);
		if (problem) return fail(400, { update: { id, error: problem, values } });
		// Revoked in another window: the key is gone from the list, so there is no form to answer in.
		if (!Number.isSafeInteger(id)) error(404);
		const updated = updateApiKey(
			database(),
			id,
			values.allProjects ? 'all' : values.projects,
			values.validUntil || null
		);
		if ('error' in updated) {
			if (updated.error === 'unknown-key') error(404);
			return fail(400, { update: { id, error: m.apikeys_error_project_gone(), values } });
		}
		return { updated: id };
	},
	revoke: async ({ request }) => {
		const id = Number((await request.formData()).get('id'));
		revokeApiKey(database(), id);
	}
} satisfies Actions;
