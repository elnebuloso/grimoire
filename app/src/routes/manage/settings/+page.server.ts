import type { Actions, PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { MIN_PASSPHRASE_LENGTH } from '#lib/server/instance-export.js';
import { readSettings, saveSettings } from '#lib/server/settings.js';
import { isSlug } from '#lib/slug.js';
import { m } from '#lib/paraglide/messages.js';

export const load: PageServerLoad = ({ url }) => ({
	settings: readSettings(database()),
	minPassphraseLength: MIN_PASSPHRASE_LENGTH,
	// Set by the export when it refuses; it leads back here.
	exportProblem: exportMessage(
		url.searchParams.get('export'),
		(url.searchParams.get('sources') ?? '').split(',').filter(isSlug)
	)
});

// A refusal of the passphrase marks its field; unreadable tokens are fixed on their sources.
function exportMessage(
	problem: string | null,
	sources: string[]
): { message: string; aboutPassphrase: boolean } | undefined {
	if (problem === 'passphrase-too-short') {
		const message = m.export_passphrase_too_short({ min: MIN_PASSPHRASE_LENGTH });
		return { message, aboutPassphrase: true };
	}
	if (problem === 'passphrase-mismatch') {
		return { message: m.export_passphrase_mismatch(), aboutPassphrase: true };
	}
	if (problem === 'unreadable-tokens' && sources.length > 0) {
		const message = m.export_unreadable_tokens({ sources: sources.join(', ') });
		return { message, aboutPassphrase: false };
	}
	return undefined;
}

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		saveSettings(database(), { syncsPaused: data.get('syncsPaused') === 'on' });
		return { saved: true };
	}
} satisfies Actions;
