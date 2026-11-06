import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ActionResult } from '@sveltejs/kit';
import { invalidateAll } from '$app/navigation';
import { submitWithToast } from './forms';
import { toasts } from './toasts.svelte';

vi.mock('$app/navigation', () => ({ invalidateAll: vi.fn(async () => {}) }));

/** A form with a field and a submit button, as a page renders it. */
function form() {
	const element = document.createElement('form');
	element.innerHTML = '<input name="name"><input name="email"><button>Save</button>';
	document.body.replaceChildren(element);
	return { element, button: element.querySelector('button')! };
}

/** Runs a submit through `submitWithToast` as `enhance` would, with the action's `result`. */
async function submit(options: Parameters<typeof submitWithToast>[0], result: ActionResult) {
	const { element, button } = form();
	const update = vi.fn(async () => {});
	const after = submitWithToast(options)({ submitter: button } as never);
	expect(button.disabled).toBe(true);
	expect(button.getAttribute('aria-busy')).toBe('true');
	await (after as (input: unknown) => Promise<void>)({ result, formElement: element, update });
	return { element, button, update };
}

beforeEach(() => {
	toasts.splice(0);
	vi.mocked(invalidateAll).mockClear();
});

describe('submitWithToast', () => {
	it('refreshes in place and toasts after a redirect back to the same page', async () => {
		const onsuccess = vi.fn();
		const { button, update } = await submit(
			{ success: () => 'Saved.', onsuccess },
			{ type: 'redirect', status: 303, location: location.pathname }
		);

		expect(invalidateAll).toHaveBeenCalledOnce();
		expect(update).not.toHaveBeenCalled();
		expect(toasts.map((toast) => toast.message)).toEqual(['Saved.']);
		expect(onsuccess).toHaveBeenCalledOnce();
		expect(button.disabled).toBe(false);
		expect(button.hasAttribute('aria-busy')).toBe(false);
	});

	it('toasts before leaving for another page', async () => {
		const { update } = await submit(
			{ success: () => 'Created.' },
			{ type: 'redirect', status: 303, location: '/elsewhere' }
		);

		expect(toasts.map((toast) => toast.message)).toEqual(['Created.']);
		expect(update).toHaveBeenCalledWith({ reset: false });
		expect(invalidateAll).not.toHaveBeenCalled();
	});

	it('hands a refusal to the page and focuses the field it names', async () => {
		const onsuccess = vi.fn();
		const { element, update } = await submit(
			{ success: () => 'Saved.', onsuccess },
			{ type: 'failure', status: 400, data: { error: 'Enter an email address.', field: 'email' } }
		);

		expect(update).toHaveBeenCalledWith({ reset: false, navigate: false });
		expect(document.activeElement).toBe(element.querySelector('[name="email"]'));
		expect(toasts).toEqual([]);
		expect(onsuccess).not.toHaveBeenCalled();
	});

	it('gives a refusal to onfailure instead, leaving the page as it is', async () => {
		const onfailure = vi.fn();
		const { element, update } = await submit(
			{ onfailure },
			{ type: 'failure', status: 400, data: { error: 'Choose a source.', field: 'name' } }
		);

		expect(onfailure).toHaveBeenCalledWith({ error: 'Choose a source.', field: 'name' });
		expect(update).not.toHaveBeenCalled();
		expect(document.activeElement).toBe(element.querySelector('[name="name"]'));
	});

	it('lets the page show an error answer, without a toast', async () => {
		const { button, update } = await submit(
			{ success: () => 'Saved.' },
			{ type: 'error', status: 500, error: new Error('database is locked') }
		);

		expect(update).toHaveBeenCalledWith({ reset: false, navigate: false });
		expect(toasts).toEqual([]);
		expect(button.disabled).toBe(false);
	});
});
