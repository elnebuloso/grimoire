import type { PageServerLoad } from './$types';
import { INSTANCE_NAME } from '$app/env/private';
import { slugify } from '#lib/slug.js';
import { database } from '#lib/server/db/index.js';
import { answerQueryForm } from '#lib/server/query-form.js';
import { sourceStats } from '#lib/server/stats.js';
import { readableSlugs } from '#lib/server/api-keys.js';
import { publicOrigin } from '#lib/server/public-origin.js';

export const load: PageServerLoad = ({ url, locals }) => {
	const db = database();
	// A visitor sees the public sources, a user also the ones they may read with their keys.
	const readable = locals.user ? readableSlugs(db, locals.user.id) : undefined;
	const sources = sourceStats(db).filter((source) =>
		readable ? readable.includes(source.slug) : source.visibility === 'public'
	);
	const publicSources = sources
		.filter((source) => source.visibility === 'public')
		.map((source) => source.slug);
	return {
		sources,
		// Only public sources are searched here, whoever is logged in.
		query: publicSources.length > 0 ? answerQueryForm(db, url, publicSources, 'public') : undefined,
		origin: publicOrigin(url),
		// The server name in the `claude mcp add` example: one word the CLI takes as it is.
		mcpName: slugify(INSTANCE_NAME) || 'grimoire'
	};
};
