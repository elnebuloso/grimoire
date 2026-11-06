import type { Actions, PageServerLoad } from './$types';
import { TZ } from '$app/env/private';
import { database } from '#lib/server/db/index.js';
import { isExpired, listApiKeys, revokeApiKey } from '#lib/server/api-keys.js';
import { listPage, readListParams, type ListSpec } from '#lib/list.js';
import { dateIn } from '#lib/time-zone.js';

type Key = ReturnType<typeof listApiKeys>[number] & { expired: boolean };

const KEY_LIST: ListSpec<Key> = {
	search: (key) => `${key.name} ${key.owner ?? ''}`,
	// Reached from the users list, by the exact address.
	filters: { owner: (key) => key.owner ?? '' },
	sorts: {
		name: (key) => key.name,
		validUntil: (key) => key.validUntil,
		used: (key) => key.lastUsedAt
	}
};

// Every key of every user, for the admins: they may revoke any of them, only its owner edits one.
export const load: PageServerLoad = ({ url }) => {
	const params = readListParams(url, KEY_LIST);
	const today = dateIn(TZ, new Date());
	const keys = listApiKeys(database()).map((key) => ({
		...key,
		expired: isExpired(key.validUntil, today)
	}));
	return {
		keys: listPage(keys, params, KEY_LIST),
		owner: params.filters.owner,
		filtered: params.search !== '' || params.filters.owner !== undefined
	};
};

export const actions = {
	revoke: async ({ request }) => {
		const id = Number((await request.formData()).get('id'));
		revokeApiKey(database(), id);
	}
} satisfies Actions;
