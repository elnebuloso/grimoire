import type { Actions, PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { readSettings, saveSettings } from '#lib/server/settings.js';

export const load: PageServerLoad = () => ({ settings: readSettings(database()) });

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		saveSettings(database(), { syncsPaused: data.get('syncsPaused') === 'on' });
		return { saved: true };
	}
} satisfies Actions;
