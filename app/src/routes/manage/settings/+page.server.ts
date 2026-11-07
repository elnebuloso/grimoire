import type { Actions, PageServerLoad } from './$types';
import { database } from '#lib/server/db/index.js';
import { MIN_PASSPHRASE_LENGTH } from '#lib/server/instance-export.js';
import { readSettings, saveSettings } from '#lib/server/settings.js';
import { isSlug } from '#lib/slug.js';
import { m } from '#lib/paraglide/messages.js';
import type { Refusal } from '#lib/forms.js';
import { authMessage } from '#lib/server/auth/auth-messages.js';

export const load: PageServerLoad = ({ url }) => ({
	settings: readSettings(database()),
	minPassphraseLength: MIN_PASSPHRASE_LENGTH,
	// Set by the export when it refuses; it leads back here.
	exportProblem: exportMessage(
		url.searchParams.get('export'),
		(url.searchParams.get('sources') ?? '').split(',').filter(isSlug)
	)
});

// A refusal of the passphrase or the current password marks its field; unreadable tokens are
// fixed on their sources.
function exportMessage(problem: string | null, sources: string[]): Refusal | undefined {
	if (problem === 'passphrase-too-short') {
		const error = m.export_passphrase_too_short({ min: MIN_PASSPHRASE_LENGTH });
		return { error, field: 'passphrase' };
	}
	if (problem === 'passphrase-mismatch') {
		return { error: m.export_passphrase_mismatch(), field: 'passphrase' };
	}
	if (problem === 'wrong-current-password' || problem === 'blocked') {
		return { error: authMessage(problem), field: 'current' };
	}
	if (problem === 'unreadable-tokens' && sources.length > 0) {
		return { error: m.export_unreadable_tokens({ sources: sources.join(', ') }) };
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
