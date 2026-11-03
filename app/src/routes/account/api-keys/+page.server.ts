import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { TZ } from '$app/env/private';
import { database } from '#lib/server/db/index.js';
import {
	createApiKey,
	isExpired,
	listApiKeys,
	readableSlugs,
	revokeApiKey,
	updateApiKey
} from '#lib/server/api-keys.js';
import { m } from '#lib/paraglide/messages.js';
import { dateIn } from '#lib/time-zone.js';

// Every user manages their own keys here, over the sources they may read. The access hook lets
// only logged-in users onto account pages.
export const load: PageServerLoad = ({ locals }) => {
	const today = dateIn(TZ, new Date());
	const db = database();
	return {
		keys: listApiKeys(db, locals.user!.id).map((key) => ({
			...key,
			expired: isExpired(key.validUntil, today)
		})),
		sources: readableSlugs(db, locals.user!.id),
		today
	};
};

/** Scope and expiry as both forms send them, or the message saying what is wrong. */
function readAccess(data: FormData) {
	const allSources = data.get('scope') === 'all';
	const sources = data.getAll('sources').map(String);
	const validUntil = String(data.get('validUntil') ?? '').trim();
	const values = { allSources, sources, validUntil };
	if (!allSources && sources.length === 0) return { values, error: m.apikeys_error_scope() };
	if (validUntil && !isDate(validUntil)) return { values, error: m.apikeys_error_valid_until() };
	if (validUntil && isExpired(validUntil, dateIn(TZ, new Date()))) {
		return { values, error: m.apikeys_error_valid_until_past() };
	}
	return { values };
}

// `Date` rolls `2026-02-31` over to 3 March; only a date that reads back the same exists.
function isDate(value: string): boolean {
	const date = new Date(`${value}T00:00:00Z`);
	return (
		/^\d{4}-\d{2}-\d{2}$/.test(value) &&
		!Number.isNaN(date.getTime()) &&
		date.toISOString().slice(0, 10) === value
	);
}

export const actions = {
	create: async ({ request, locals }) => {
		const data = await request.formData();
		const name = String(data.get('name') ?? '').trim();
		const access = readAccess(data);
		const values = { name, ...access.values };

		if (!name) return fail(400, { error: m.apikeys_error_name(), values });
		if (access.error) return fail(400, { error: access.error, values });
		const created = createApiKey(
			database(),
			name,
			values.allSources ? 'all' : values.sources,
			values.validUntil || null,
			locals.user!.id
		);
		// A source deleted, or made private by its owner, while the form was open.
		if ('error' in created) return fail(400, { error: m.apikeys_error_source_gone(), values });
		return { created: { name, key: created.key } };
	},
	update: async ({ request, locals }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		const { values, error: problem } = readAccess(data);
		if (problem) return fail(400, { update: { id, error: problem, values } });
		// Revoked in another window: the key is gone from the list, so there is no form to answer in.
		if (!Number.isSafeInteger(id)) error(404);
		const updated = updateApiKey(
			database(),
			id,
			values.allSources ? 'all' : values.sources,
			values.validUntil || null,
			locals.user!.id
		);
		if ('error' in updated) {
			if (updated.error === 'unknown-key') error(404);
			return fail(400, { update: { id, error: m.apikeys_error_source_gone(), values } });
		}
		return { updated: id };
	},
	revoke: async ({ request, locals }) => {
		const id = Number((await request.formData()).get('id'));
		revokeApiKey(database(), id, locals.user!.id);
	}
} satisfies Actions;
