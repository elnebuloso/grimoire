import { INSTANCE_NAME } from '$app/env/private';
import { slugify } from '#lib/slug.js';
import { publicOrigin } from './public-origin.js';

/** Where an agent connects to, and the server name the `claude mcp add` command gives it. */
export function connectTarget(url: URL): { origin: string; mcpName: string } {
	// One word the CLI takes as it is.
	return { origin: publicOrigin(url), mcpName: slugify(INSTANCE_NAME) || 'grimoire' };
}
