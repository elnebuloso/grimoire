import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { TZ } from '$app/env/private';
import { database } from '#lib/server/db/index.js';
import {
	createApiKey,
	isExpired,
	listApiKeys,
	revokeApiKey,
	sourceChoices,
	updateApiKey
} from '#lib/server/api-keys.js';
import { m } from '#lib/paraglide/messages.js';
import { dateIn } from '#lib/time-zone.js';
import { connectTarget } from '#lib/server/connect.js';

// Every user manages their own keys here. The access hook lets
// only logged-in users onto account pages.
export const load: PageServerLoad = ({ locals, url }) => {
	const today = dateIn(TZ, new Date());
	const db = database();
	return {
		keys: listApiKeys(db, locals.user!.id).map((key) => ({
			...key,
			expired: isExpired(key.validUntil, today)
		})),
		sources: sourceChoices(db),
		today,
		...connectTarget(url)
	};
};

/** Scope and expiry as both forms send them, or the message and field saying what is wrong. */
function readAccess(data: FormData) {
	const allSources = data.get('scope') === 'all';
	const sources = data.getAll('sources').map(String);
	const validUntil = String(data.get('validUntil') ?? '').trim();
	const values = { allSources, sources, validUntil };
	if (!allSources && sources.length === 0) {
		return { values, refusal: { error: m.apikeys_error_scope(), field: 'scope' } };
	}
	if (validUntil && !isDate(validUntil)) {
		return { values, refusal: { error: m.apikeys_error_valid_until(), field: 'validUntil' } };
	}
	if (validUntil && isExpired(validUntil, dateIn(TZ, new Date()))) {
		return { values, refusal: { error: m.apikeys_error_valid_until_past(), field: 'validUntil' } };
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

		if (!name) return fail(400, { error: m.apikeys_error_name(), field: 'name', values });
		if (access.refusal) return fail(400, { ...access.refusal, values });
		const created = createApiKey(
			database(),
			name,
			values.allSources ? 'all' : values.sources,
			values.validUntil || null,
			locals.user!.id
		);
		// A source deleted while the form was open.
		if ('error' in created) {
			return fail(400, { error: m.apikeys_error_source_gone(), field: 'scope', values });
		}
		return { created: { name, key: created.key } };
	},
	update: async ({ request, locals }) => {
		const data = await request.formData();
		const id = Number(data.get('id'));
		const { values, refusal } = readAccess(data);
		if (refusal) return fail(400, { ...refusal, values });
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
			return fail(400, { error: m.apikeys_error_source_gone(), field: 'scope', values });
		}
		return { updated: id };
	},
	revoke: async ({ request, locals }) => {
		const id = Number((await request.formData()).get('id'));
		if (!revokeApiKey(database(), id, locals.user!.id)) error(404);
	}
} satisfies Actions;
