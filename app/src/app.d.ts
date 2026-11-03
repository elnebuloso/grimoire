// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			/** Set by the access hook for a page the request may not open; its load throws it. */
			accessDenied?: 403 | 404;
			/** The logged-in user, set by the access hook; undefined without a valid session. */
			user?: import('#lib/server/admin/auth.js').SessionUser;
		}
		interface PageData {
			/** The title of the instance for people, from `INSTANCE_TITLE`; the root layout provides it. */
			instanceTitle: string;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
