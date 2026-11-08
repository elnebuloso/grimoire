import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { Refusal } from '#lib/forms.js';
import { ENCRYPTION_KEY, GIT_ALLOWED_HOSTS, SYNC_SCHEDULE, TZ } from '$app/env/private';
import { database } from '#lib/server/db/index.js';
import { deleteSource } from '#lib/server/db/sources.js';
import { requestSyncInBackground, syncPending } from '#lib/server/sync/index.js';
import { redactUrl } from '#lib/server/redact-url.js';
import { connectionPolicy } from '#lib/server/sync/connection-policy.js';
import { nextRun } from '#lib/server/sync/schedule.js';
import { checkAccess, checkSourceAccess } from '#lib/server/admin/source-access.js';
import { readFormSecret } from '#lib/server/admin/form-secret.js';
import { readSourceFields } from '#lib/source-fields.js';
import { m } from '#lib/paraglide/messages.js';
import {
	changeSourceSlug,
	findSource,
	parseIdParam,
	saveSource,
	savingChanges,
	sourceConflict,
	sourceProblem,
	storedSource,
	type SourceConflict,
	type SourceForm,
	type SourceSettings,
	type StoredSource
} from '#lib/server/admin/sources.js';
import { overlapsOf, previewPage, sourceStatus } from '#lib/server/admin/status.js';
import { readSettings, syncsAutomatically } from '#lib/server/settings.js';
/** The source of the page; undefined for `/manage/sources/new`. */
function sourceFor(params: { id: string }): SourceSettings | undefined {
	const id = parseIdParam(params.id);
	if (id === 'new') return undefined;
	const source = id && findSource(database(), id);
	if (!source) error(404);
	return source;
}

export const load: PageServerLoad = ({ params, url, locals }) => {
	const source = sourceFor(params);
	// A new source has its settings only.
	if (!source && params.tab) error(404);
	const schedule = source?.schedule ?? SYNC_SCHEDULE;
	const previewFile = url.searchParams.get('preview');
	// A preview link from before the sub pages: the preview lives on Pages now.
	if (source && previewFile !== null && !params.tab)
		redirect(303, `${url.pathname}/pages${url.search}`);
	const { syncsPaused } = readSettings(database());
	const tab = params.tab ?? 'status';
	return {
		source,
		tab,
		// Only what the tab shows; the head needs the state, which every tab gets.
		status:
			source &&
			sourceStatus(database(), source.id, {
				pages: tab === 'pages',
				history: tab === 'history',
				deadLinks: tab === 'status'
			}),
		overlaps: source && tab === 'status' ? overlapsOf(database(), source.id, locals) : [],
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
	const token = readFormSecret(data, ENCRYPTION_KEY.formSecrets);
	const form: SourceForm = { ...fields, token: token.value, removeToken: token.remove };
	const values = {
		...fields,
		gitUrl: redactUrl(fields.gitUrl),
		removeToken: token.remove,
		encryptedToken: token.sealed
	};
	const damaged = token.damaged ? { error: m.error_token_damaged(), field: 'token' } : undefined;
	return { form, values, damaged };
}

/** Why the Git server refuses the source in `form`, as the form shows it; undefined when it may be saved. */
async function accessProblem(
	stored: StoredSource | undefined,
	form: SourceForm
): Promise<Refusal | undefined> {
	const access = await checkAccess(
		ENCRYPTION_KEY.sourceTokens,
		stored,
		form,
		connectionPolicy(GIT_ALLOWED_HOSTS)
	);
	return 'error' in access ? access : undefined;
}

/**
 * What the form shows for a conflict: a refused duplicate, or an overlap not yet confirmed, which
 * asks for the confirmation box.
 */
function conflictAnswer(
	conflict: SourceConflict | undefined,
	overlapConfirmed: boolean
): (Refusal & { overlap?: true }) | undefined {
	if (conflict?.kind === 'duplicate')
		return { error: m.error_source_duplicate({ name: conflict.name }) };
	if (conflict?.kind === 'overlap' && !overlapConfirmed) {
		return {
			error: m.warning_source_overlap({ name: conflict.name }),
			field: 'confirmOverlap',
			overlap: true
		};
	}
	return undefined;
}

// What a save is based on, without the outcome of the last sync, which a sync may change at any
// time.
function settingsOf(stored: StoredSource | undefined): string {
	return JSON.stringify(stored && { ...stored, error: undefined }) ?? '';
}

export const actions = {
	save: async ({ request, params }) => {
		const source = sourceFor(params);
		const data = await request.formData();
		const { form, values, damaged } = readSourceForm(data);
		const db = database();
		const stored = storedSource(db, source?.id);
		const changes = savingChanges(stored, form);
		const problem = damaged ?? sourceProblem(db, source?.id, stored, form);
		if (problem) return fail(400, { ...problem, values });
		const confirmed = data.get('confirmOverlap') === 'on';
		const conflict = conflictAnswer(sourceConflict(db, source?.id, stored, form), confirmed);
		if (conflict) return fail(400, { ...conflict, values });

		const unreachable =
			changes.access || changes.location ? await accessProblem(stored, form) : undefined;
		if (unreachable) return fail(400, { ...unreachable, values });
		// The Git server may take seconds; another save may have changed this source, taken its name
		// or added the same documentation meanwhile. No await follows, so nothing changes between
		// these checks and the write.
		const current = storedSource(db, source?.id);
		// Deleted in another tab.
		if (source && !current) error(404);
		if (settingsOf(current) !== settingsOf(stored)) {
			return fail(400, { error: m.error_source_changed(), values });
		}
		const lateProblem = sourceProblem(db, source?.id, stored, form);
		if (lateProblem) return fail(400, { ...lateProblem, values });
		const late = conflictAnswer(sourceConflict(db, source?.id, stored, form), confirmed);
		if (late) return fail(400, { ...late, values });

		const result = saveSource(db, ENCRYPTION_KEY.sourceTokens, source?.id, form, changes);
		// Deleted in another tab while the Git server was asked.
		if (result === 'not-found') error(404);

		// Forced only when the index changes, so a changed path or exclusions take effect without
		// waiting for a new commit; a forced sync of a large source holds every other one for minutes.
		// Changed access gets a run of its own: one already running still uses the old token.
		const syncs = syncsAutomatically(db, form);
		if (syncs) {
			requestSyncInBackground(result.id, { force: changes.reindex, fresh: changes.access });
		}
		// A new source opens on its status; saved settings stay in view, and the answer says
		// whether a sync of the whole source started or only a check for a new commit.
		if (!source) redirect(303, `/manage/sources/${result.id}`);
		return { saved: true, reindexing: syncs && changes.reindex };
	},
	test: async ({ request, params }) => {
		// Only the remote, not `sourceProblem`: access can be tested before the source is named.
		const source = sourceFor(params);
		const { form, values, damaged } = readSourceForm(await request.formData());
		if (damaged) return fail(400, { ...damaged, values });
		const access = await checkSourceAccess(
			database(),
			ENCRYPTION_KEY.sourceTokens,
			source?.id,
			form,
			connectionPolicy(GIT_ALLOWED_HOSTS)
		);
		return { access, values };
	},
	sync: async ({ params, url }) => {
		const source = sourceFor(params);
		if (!source) error(404);
		// Not awaited: the sync waits for every one queued before it, longer than a reverse proxy
		// keeps a request open. The page shows that it is pending, and its outcome once it ends.
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
			return fail(400, { error: changed.error });
		}
		return { slugChanged: true };
	},
	delete: async ({ request, params }) => {
		const source = sourceFor(params);
		if (!source) redirect(303, '/manage/sources');
		// The dialog asks for the slug too; this holds for any client.
		const confirmation = String((await request.formData()).get('confirmation') ?? '');
		if (confirmation !== source.slug)
			return fail(400, { error: m.error_slug_confirmation({ slug: source.slug }) });
		await deleteSource(database(), source.id);
		redirect(303, '/manage/sources');
	}
} satisfies Actions;
