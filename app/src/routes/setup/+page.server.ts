import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { ENCRYPTION_KEY, GIT_ALLOWED_HOSTS } from '$app/env/private';
import { database } from '#lib/server/db/index.js';
import { migrations } from '#lib/server/db/schema.js';
import {
	checkAdminAccount,
	checkSetupToken,
	login,
	setupAdmin,
	SESSION_COOKIE,
	sessionCookieOptions
} from '#lib/server/admin/auth.js';
import { authMessage } from '#lib/server/admin/auth-messages.js';
import { importExport, type ImportProblem } from '#lib/server/instance-import.js';
import { log } from '#lib/server/log.js';
import { connectionPolicy, refusedSources } from '#lib/server/sync/connection-policy.js';
import { m } from '#lib/paraglide/messages.js';

// A plain form needs no JavaScript; hydrating it would reset what was typed before it finished.
export const csr = false;

// The access hook decides; thrown here, the error renders in the layout.
export const load: PageServerLoad = ({ locals }) => {
	if (locals.accessDenied) error(locals.accessDenied);
};

// The field a refusal concerns, marked on the page; none when it is about the instance.
const IMPORT_REFUSALS: Record<ImportProblem, { message: () => string; field?: string }> = {
	'instance-not-empty': { message: () => m.import_instance_not_empty() },
	'not-an-export': { message: () => m.import_not_an_export(), field: 'file' },
	'newer-format': { message: () => m.import_newer_version(), field: 'file' },
	'newer-schema': { message: () => m.import_newer_version(), field: 'file' },
	'wrong-passphrase-or-damaged': { message: () => m.import_wrong_passphrase(), field: 'passphrase' }
};

export const actions = {
	create: async ({ request, cookies, getClientAddress }) => {
		const data = await request.formData();
		const form = {
			token: String(data.get('token') ?? ''),
			email: String(data.get('email') ?? ''),
			password: String(data.get('password') ?? '')
		};
		const db = database();
		const refused = await setupAdmin(db, form);
		if (refused) return fail(400, { error: authMessage(refused.error), email: form.email });
		const result = await login(db, getClientAddress(), form);
		if ('session' in result) cookies.set(SESSION_COOKIE, result.session, sessionCookieOptions);
		redirect(303, '/manage');
	},

	// Instead of the first admin: the admins of the export log in with their own accounts.
	import: async ({ request }) => {
		const data = await request.formData();
		const db = database();
		const refused = checkSetupToken(db, String(data.get('token') ?? ''));
		if (refused) return fail(400, { importError: authMessage(refused.error), field: 'token' });
		const file = data.get('file');
		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { importError: m.import_no_file(), field: 'file' });
		}
		const result = await importExport(
			db,
			Buffer.from(await file.arrayBuffer()),
			String(data.get('passphrase') ?? ''),
			migrations,
			ENCRYPTION_KEY.sourceTokens
		);
		if ('error' in result) {
			const { message, field } = IMPORT_REFUSALS[result.error];
			return fail(400, { importError: message(), field });
		}
		checkAdminAccount(db);
		log.info(`export imported on the setup page: ${result.users} users, ${result.sources} sources`);
		for (const { slug, reason } of await refusedSources(db, connectionPolicy(GIT_ALLOWED_HOSTS))) {
			log.warn(`imported source ${slug} cannot sync: ${reason}`);
		}
		redirect(303, '/login?imported');
	}
} satisfies Actions;
