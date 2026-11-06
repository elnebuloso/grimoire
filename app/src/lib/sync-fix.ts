import { m } from '#lib/paraglide/messages.js';
import type { SyncErrorKind } from '#lib/server/sync/error-kind.js';

/** How an admin fixes each kind of sync error. */
export const SYNC_FIX: Record<SyncErrorKind, () => string> = {
	path: m.admin_fix_path,
	branch: m.admin_fix_branch,
	access: m.admin_fix_access,
	unreachable: m.admin_fix_unreachable,
	redirect: m.admin_fix_redirect,
	forbidden: m.admin_fix_forbidden,
	noAddress: m.admin_fix_no_address,
	deadline: m.admin_fix_deadline,
	aborted: m.admin_fix_aborted,
	noPage: m.admin_fix_no_page,
	unknown: m.admin_fix_unknown
};

/** What each kind of sync error means, in the reader's language; `unknown` has no summary. */
export const SYNC_ERROR: Record<Exclude<SyncErrorKind, 'unknown'>, () => string> = {
	path: m.sync_error_path,
	branch: m.sync_error_branch,
	access: m.sync_error_access,
	unreachable: m.sync_error_unreachable,
	redirect: m.sync_error_redirect,
	forbidden: m.sync_error_forbidden,
	noAddress: m.sync_error_no_address,
	deadline: m.sync_error_deadline,
	aborted: m.sync_error_aborted,
	noPage: m.sync_error_no_page
};
