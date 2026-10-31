import type { DatabaseSync } from 'node:sqlite';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { ENCRYPTION_KEY, SYNC_SCHEDULE, TZ } from '$app/env/private';
import { database } from '#lib/server/db/index.js';
import { deleteSource } from '#lib/server/db/sources.js';
import { requestSyncInBackground, syncPending } from '#lib/server/sync/index.js';
import { redactUrl } from '#lib/server/sync/git.js';
import { nextRun } from '#lib/server/sync/schedule.js';
import { accessChanged, checkSourceAccess } from '#lib/server/admin/source-access.js';
import { readFormSecret, SOURCE_TOKEN_FIELDS } from '#lib/server/admin/form-secret.js';
import { readSourceFields } from '#lib/source-fields.js';
import { m } from '#lib/paraglide/messages.js';
import {
	changeSourceSlug,
	findSource,
	parseIdParam,
	saveSource,
	savingReindexes,
	sourceProblem,
	type SourceForm,
	type SourceSettings
} from '#lib/server/admin/sources.js';
import { previewPage, sourceStatus } from '#lib/server/admin/status.js';
import { readSettings, syncsAutomatically } from '#lib/server/settings.js';

/** The source of the page; undefined for `/manage/sources/new`. */
function sourceFor(params: { id: string }): SourceSettings | undefined {
	const id = parseIdParam(params.id);
	if (id === 'new') return undefined;
	const source = id && findSource(database(), id);
	if (!source) error(404);
	return source;
}

export const load: PageServerLoad = ({ params, url }) => {
	const source = sourceFor(params);
	const schedule = source?.schedule ?? SYNC_SCHEDULE;
	const previewFile = url.searchParams.get('preview');
	const { syncsPaused } = readSettings(database());
	return {
		source,
		status: source && sourceStatus(database(), source.id),
		syncPending: source !== undefined && syncPending(source.id),
		preview:
			source && previewFile
				? {
						file: previewFile,
						snippets: previewPage(database(), source.slug, previewFile)
					}
				: undefined,
		globalSchedule: SYNC_SCHEDULE,
		syncsPaused,
		nextCheck:
			source?.paused || syncsPaused ? undefined : nextRun(schedule, new Date(), TZ)?.toISOString()
	};
};

/**
 * The form as sent, the values to send back into it, and the problem of a damaged carried token.
 * Secrets are not sent back, not even into the form they came from: an entered token returns only
 * encrypted, so a test or a rejected save keeps it without the page ever holding it in plain text.
 */
function readSourceForm(data: FormData) {
	const fields = readSourceFields(data);
	const token = readFormSecret(data, ENCRYPTION_KEY.formSecrets, SOURCE_TOKEN_FIELDS);
	const form: SourceForm = { ...fields, token: token.value, removeToken: token.remove };
	const values = {
		...fields,
		gitUrl: redactUrl(fields.gitUrl),
		removeToken: token.remove,
		encryptedToken: token.sealed
	};
	return { form, values, damaged: token.damaged ? m.error_token_damaged() : undefined };
}

async function accessProblem(
	db: DatabaseSync,
	sourceId: number | undefined,
	form: SourceForm
): Promise<string | undefined> {
	const access = await checkSourceAccess(db, ENCRYPTION_KEY.sourceTokens, sourceId, form);
	return 'error' in access ? access.error : undefined;
}

export const actions = {
	save: async ({ request, params }) => {
		const source = sourceFor(params);
		const { form, values, damaged } = readSourceForm(await request.formData());
		const db = database();
		const problem =
			damaged ??
			sourceProblem(db, source?.id, form) ??
			(accessChanged(db, source?.id, form) ? await accessProblem(db, source?.id, form) : undefined);
		if (problem) return fail(400, { error: problem, values });

		const reindex = savingReindexes(db, source?.id, form);
		const result = saveSource(db, ENCRYPTION_KEY.sourceTokens, source?.id, form);
		// Deleted in another tab while the Git server was asked.
		if (result === 'not-found') error(404);
		if ('error' in result) return fail(400, { error: result.error, values });

		// Forced only when the index changes, so a changed path or exclusions take effect without
		// waiting for a new commit; a forced sync of a large source holds every other one for minutes.
		if (syncsAutomatically(db, form)) requestSyncInBackground(result.id, { force: reindex });
		redirect(303, `/manage/sources/${result.id}`);
	},
	test: async ({ request, params }) => {
		const source = sourceFor(params);
		const { form, values, damaged } = readSourceForm(await request.formData());
		if (damaged) return fail(400, { error: damaged, values });
		const access = await checkSourceAccess(
			database(),
			ENCRYPTION_KEY.sourceTokens,
			source?.id,
			form
		);
		return { access, values };
	},
	sync: async ({ params, url }) => {
		const source = sourceFor(params);
		if (!source) error(404);
		// Not awaited: the sync waits for every one queued before it, longer than a reverse proxy
		// keeps a request open. The page shows that it is pending, and its outcome in the status.
		requestSyncInBackground(source.id, { force: true });
		// Back to the page by GET, so reloading it for the outcome does not queue another sync.
		redirect(303, url.pathname);
	},
	slug: async ({ request, params }) => {
		const source = sourceFor(params);
		if (!source) error(404);
		const data = await request.formData();
		const form = {
			slug: String(data.get('slug') ?? ''),
			confirmation: String(data.get('confirmation') ?? '')
		};
		const changed = changeSourceSlug(database(), source.id, form);
		if (changed === 'not-found') error(404);
		if ('error' in changed) {
			return fail(400, { slugError: changed.error, slugValues: { slug: form.slug } });
		}
		return { slugChanged: true };
	},
	delete: async ({ params }) => {
		const source = sourceFor(params);
		if (source) await deleteSource(database(), source.id);
		redirect(303, '/manage');
	}
} satisfies Actions;
