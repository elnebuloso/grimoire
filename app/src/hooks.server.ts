import type { ServerInit } from '@sveltejs/kit/hooks';
import { database } from '#lib/server/db/index.js';

// Creates the schema on first start and fails fast on an unusable path.
export const init: ServerInit = () => {
	database();
};
