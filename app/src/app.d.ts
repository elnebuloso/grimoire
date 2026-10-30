// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			/** Set by the access hook for a page the request may not open; its load throws it. */
			accessDenied?: 403 | 404;
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
