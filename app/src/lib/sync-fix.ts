import { m } from '#lib/paraglide/messages.js';
import type { SyncErrorKind } from '#lib/server/sync/error-kind.js';

/** How an admin fixes each kind of sync error. */
export const SYNC_FIX: Record<SyncErrorKind, () => string> = {
	path: m.admin_fix_path,
	branch: m.admin_fix_branch,
	access: m.admin_fix_access,
	unreachable: m.admin_fix_unreachable,
	deadline: m.admin_fix_deadline,
	aborted: m.admin_fix_aborted,
	noPage: m.admin_fix_no_page,
	unknown: m.admin_fix_unknown
};
