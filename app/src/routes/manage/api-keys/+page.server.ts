import type { Actions, PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { listApiKeys, revokeApiKey } from '#lib/server/api-keys.js';
import { listPage, readListParams, type ListSpec } from '#lib/list.js';

type Key = ReturnType<typeof listApiKeys>[number];

const KEY_LIST: ListSpec<Key> = {
	search: (key) => `${key.name} ${key.owner ?? ''}`,
	sorts: { name: (key) => key.name, used: (key) => key.lastUsedAt }
};

// Every key of every user, for the admins: they may revoke any of them, only its owner edits one.
export const load: PageServerLoad = ({ url }) => {
	const params = readListParams(url, KEY_LIST);
	return {
		keys: listPage(listApiKeys(database()), params, KEY_LIST),
		filtered: params.search !== ''
	};
};

export const actions = {
	revoke: async ({ request }) => {
		const id = Number((await request.formData()).get('id'));
		revokeApiKey(database(), id);
	}
} satisfies Actions;
