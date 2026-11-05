import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { database } from '#lib/server/db/index.js';
import { findSource, parseIdParam } from '#lib/server/admin/sources.js';
import { syncPending } from '#lib/server/sync/index.js';

/** Whether a sync of the source is still queued or running; the source page polls it. */
export const GET: RequestHandler = ({ params }) => {
	const id = parseIdParam(params.id);
	const source = typeof id === 'number' ? findSource(database(), id) : undefined;
	if (!source) error(404);
	return json({ pending: syncPending(source.id) });
};
