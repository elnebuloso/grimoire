<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';
	import SourceLabel from './SourceLabel.svelte';
	import { m } from '#lib/paraglide/messages.js';

	/**
	 * Picks sources out of hundreds by search: the chosen ones gathered above the field, the matches
	 * below it. The form receives the chosen slugs under `name`. Further attributes, such as
	 * `aria-invalid`, go on the search field.
	 */
	let {
		sources,
		selected = [],
		name = 'sources',
		label,
		...search
	}: {
		sources: { slug: string; name: string }[];
		selected?: string[];
		name?: string;
		/** What the choice is for, e.g. "Only these sources". */
		label: string;
	} & HTMLInputAttributes = $props();

	/** More matches than this ask for a narrower search instead of a list to scroll. */
	const MATCHES_SHOWN = 8;

	// Starts from `selected`; the picker owns the choice from then on.
	// svelte-ignore state_referenced_locally
	let chosen = $state([...selected]);
	let query = $state('');

	const byslug = $derived(new Map(sources.map((source) => [source.slug, source])));
	const matches = $derived.by(() => {
		const needle = query.trim().toLocaleLowerCase();
		return sources.filter(
			(source) => !needle || `${source.name} ${source.slug}`.toLocaleLowerCase().includes(needle)
		);
	});

	function toggle(slug: string, on: boolean) {
		chosen = on ? [...chosen, slug] : chosen.filter((other) => other !== slug);
	}
</script>

<div class="picker" role="group" aria-label={label}>
	{#each chosen as slug (slug)}<input type="hidden" {name} value={slug} />{/each}
	{#if chosen.length > 0}
		<ul class="chosen" aria-label={m.picker_chosen({ count: chosen.length })}>
			{#each chosen as slug (slug)}
				{@const source = byslug.get(slug)}
				<li>
					<SourceLabel name={source?.name ?? slug} {slug} />
					<button
						type="button"
						class="remove"
						aria-label={m.picker_remove({ name: source?.name ?? slug })}
						onclick={() => toggle(slug, false)}>×</button
					>
				</li>
			{/each}
		</ul>
	{/if}
	<input
		type="search"
		aria-label={m.picker_search()}
		placeholder={m.picker_search()}
		autocomplete="off"
		bind:value={query}
		onkeydown={(event) => {
			// Enter in the search would submit the whole form.
			if (event.key === 'Enter') event.preventDefault();
		}}
		{...search}
	/>
	{#if matches.length === 0}
		<p class="muted">{m.picker_no_match()}</p>
	{:else}
		<ul class="matches" aria-label={m.picker_matches()}>
			{#each matches.slice(0, MATCHES_SHOWN) as source (source.slug)}
				<li>
					<label>
						<input
							type="checkbox"
							checked={chosen.includes(source.slug)}
							onchange={(event) => toggle(source.slug, event.currentTarget.checked)}
						/>
						<SourceLabel name={source.name} slug={source.slug} />
					</label>
				</li>
			{/each}
		</ul>
		{#if matches.length > MATCHES_SHOWN}
			<p class="muted" role="status">
				{m.picker_more({ shown: MATCHES_SHOWN, count: matches.length })}
			</p>
		{/if}
	{/if}
</div>

<style>
	.picker {
		display: grid;
		gap: var(--s3);
	}
	ul {
		display: grid;
		gap: var(--s2);
		list-style: none;
	}
	.chosen {
		grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
	}
	.chosen li {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--s2);
		padding: var(--s2) var(--s3);
		background: var(--well);
		border-radius: var(--r-control);
		overflow-wrap: anywhere;
	}
	.remove {
		flex: none;
		padding: 0 var(--s2);
		line-height: 1.4;
	}
	label {
		display: flex;
		align-items: flex-start;
		gap: var(--s3);
		font-weight: 400;
		cursor: pointer;
	}
	label input {
		flex: none;
		margin-top: 3px;
	}
</style>
