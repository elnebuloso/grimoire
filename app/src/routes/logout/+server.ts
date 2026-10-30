import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { database } from '#lib/server/db/index.js';
import { deleteSession, SESSION_COOKIE, sessionCookieOptions } from '#lib/server/admin/auth.js';

export const POST: RequestHandler = ({ cookies }) => {
	const session = cookies.get(SESSION_COOKIE);
	if (session) deleteSession(database(), session);
	cookies.delete(SESSION_COOKIE, sessionCookieOptions);
	redirect(303, '/login');
};
