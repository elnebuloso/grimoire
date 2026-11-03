import type { Actions, PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { listApiKeys, revokeApiKey } from '#lib/server/api-keys.js';

// Every key of every user, for the admins: they may revoke any of them, only its owner edits one.
export const load: PageServerLoad = () => ({ keys: listApiKeys(database()) });

export const actions = {
	revoke: async ({ request }) => {
		const id = Number((await request.formData()).get('id'));
		revokeApiKey(database(), id);
	}
} satisfies Actions;
