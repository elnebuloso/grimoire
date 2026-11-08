/**
 * Places an opening popover `gap` pixels below the end edge of its button. A popover sits in the
 * top layer, away from its button; page coordinates keep it with the page as it scrolls.
 */
export function placeBelow(
	event: ToggleEvent,
	button: HTMLElement | undefined,
	popover: HTMLElement | undefined,
	gap: number
) {
	if (event.newState !== 'open' || !button || !popover) return;
	const rect = button.getBoundingClientRect();
	popover.style.top = `${rect.bottom + window.scrollY + gap}px`;
	popover.style.right = `${document.documentElement.clientWidth - rect.right - window.scrollX}px`;
}
