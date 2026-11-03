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
			/** The name of the instance, from `INSTANCE_NAME`; the root layout provides it. */
			instanceName: string;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
