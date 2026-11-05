import type { PageServerLoad } from './$types';
import { INSTANCE_NAME } from '$app/env/private';
import { slugify } from '#lib/slug.js';
import { database } from '#lib/server/db/index.js';
import { answerQueryForm } from '#lib/server/query-form.js';
import { sourceStats } from '#lib/server/stats.js';
import { allSlugs } from '#lib/server/api-keys.js';
import { publicOrigin } from '#lib/server/public-origin.js';

export const load: PageServerLoad = ({ url, locals }) => {
	const db = database();
	// A visitor sees the public sources, a user every one.
	const readable = locals.user ? allSlugs(db) : undefined;
	const sources = sourceStats(db).filter((source) =>
		readable ? readable.includes(source.slug) : source.visibility === 'public'
	);
	return {
		sources,
		// Everything listed, the same as an API key of the user reads; for a visitor the public sources.
		query: sources.length > 0 ? answerQueryForm(db, url, readable ?? 'public') : undefined,
		origin: publicOrigin(url),
		// The server name in the `claude mcp add` example: one word the CLI takes as it is.
		mcpName: slugify(INSTANCE_NAME) || 'grimoire'
	};
};
