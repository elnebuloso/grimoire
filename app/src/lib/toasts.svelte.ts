import { untrack } from 'svelte';

export interface ToastItem {
	id: number;
	message: string;
}

/** The toasts on screen, the newest first. Only the browser adds any. */
export const toasts: ToastItem[] = $state([]);

let nextId = 0;

// Untracked: a toast shown from an effect would otherwise make the effect depend on the list it
// changes, and run again without end.
export function showToast(message: string) {
	untrack(() => toasts.unshift({ id: nextId++, message }));
}

export function dismissToast(id: number) {
	untrack(() => {
		const index = toasts.findIndex((toast) => toast.id === id);
		if (index !== -1) toasts.splice(index, 1);
	});
}
