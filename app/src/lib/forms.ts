import type { ActionResult, SubmitFunction } from '$app/forms';
// Not `refreshAll`: Storybook's stand-in for `$app/navigation` lacks it, and every component with a
// form imports this module. Both rerun all loads; `invalidateAll` also clears `page.state`, unused here.
import { invalidateAll } from '$app/navigation';
import { showToast } from '#lib/toasts.svelte.js';

/** What a submit function hands back to run once the action answered. */
export type SubmitResult = Exclude<Awaited<ReturnType<SubmitFunction>>, void>;

interface SubmitOptions {
	/** The toast for a successful result; nothing is shown when it returns undefined. */
	success?: (result: ActionResult) => string | undefined;
	/** Empty the form after success, for forms that create something. */
	reset?: boolean;
	/** Runs after a successful result was applied. */
	onsuccess?: () => void;
	/**
	 * Takes a refusal instead of the page: given, the page's `form` stays as it was, e.g. for a
	 * dialog that shows the refusal itself.
	 */
	onfailure?: (data: Record<string, unknown> | undefined) => void;
}

/**
 * The submit handler of every form on a page with JavaScript: the button shows that its action is
 * running, the page stays where it is and only refreshes its data, and success shows as a toast.
 * On the same page the toast is taken after the refresh, so it can read the page's new data.
 */
export function submitWithToast({
	success,
	reset = false,
	onsuccess,
	onfailure
}: SubmitOptions = {}): SubmitFunction {
	return ({ submitter }) => {
		const button = submitter instanceof HTMLButtonElement ? submitter : null;
		button?.setAttribute('aria-busy', 'true');
		if (button) button.disabled = true;
		return async ({ result, formElement, update }) => {
			const toast = () => {
				const message = success?.(result);
				if (message) showToast(message);
			};
			try {
				if (result.type === 'redirect' && result.location === location.pathname) {
					// Back to the page it was sent from: refreshed in place.
					await invalidateAll();
					if (reset) formElement.reset();
					toast();
				} else if (result.type === 'redirect') {
					// To another page: the toast is taken before this form and its texts are gone.
					toast();
					await update({ reset });
				} else if (result.type === 'failure' && onfailure) {
					onfailure(result.data);
					return;
				} else {
					await update({ reset, navigate: false });
					if (result.type === 'success') toast();
				}
				if (result.type === 'success' || result.type === 'redirect') onsuccess?.();
			} finally {
				button?.removeAttribute('aria-busy');
				if (button) button.disabled = false;
			}
		};
	};
}
