<script lang="ts">
	import ConfirmAction from '#lib/components/ConfirmAction.svelte';
	import SourceSettingsForm from '#lib/components/SourceSettingsForm.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { MAX_SLUG_LENGTH } from '#lib/slug.js';
	import type { ComponentProps } from 'svelte';
	import type { PageData } from './$types';

	/** The settings of a saved source, and below them the actions that break what others use. */
	let {
		data,
		form
	}: {
		data: PageData & { source: NonNullable<PageData['source']> };
		form: ComponentProps<typeof SourceSettingsForm>;
	} = $props();

	let newSlug = $state('');
</script>

<div class="settings"><SourceSettingsForm {...form} /></div>
<section class="danger" aria-labelledby="danger">
	<h2 id="danger">{m.source_danger_zone()}</h2>
	<section class="sheet" aria-labelledby="slug">
		<h2 id="slug">{m.slug_change_heading()}</h2>
		<p class="muted">{m.slug_change_source_effects_short()}</p>
		<ConfirmAction
			action="?/slug"
			label={m.slug_change_submit()}
			title={m.slug_change_title({ name: data.source.name, slug: newSlug || data.source.slug })}
			consequence={m.slug_change_source_effects({ slug: data.source.slug })}
			typed={{
				value: data.source.slug,
				label: m.confirm_type_slug({ slug: data.source.slug })
			}}
			success={m.slug_changed()}
		>
			<TextField
				label={m.slug_change_new()}
				name="slug"
				required
				maxlength={MAX_SLUG_LENGTH}
				value={data.source.slug}
				mono
				oninput={(event) => (newSlug = event.currentTarget.value)}
			/>
		</ConfirmAction>
	</section>
	<section class="sheet" aria-labelledby="delete">
		<h2 id="delete">{m.delete()}</h2>
		<ConfirmAction
			action="?/delete"
			label={m.source_delete()}
			title={m.source_delete_title({ name: data.source.name })}
			consequence={m.source_delete_consequence()}
			danger
			typed={{
				value: data.source.slug,
				label: m.confirm_type_slug({ slug: data.source.slug })
			}}
			success={m.source_deleted({ name: data.source.name })}
		/>
	</section>
</section>

<style>
	.settings {
		max-width: 52rem;
	}
	/* Rare and breaking: set apart below the settings, each action in a sheet of its own. */
	.danger {
		display: grid;
		grid-template-columns: 1fr 1fr;
		align-items: start;
		gap: var(--s5);
		max-width: 52rem;
		padding-top: var(--s5);
		border-top: 1px solid var(--line);
	}
	.danger > h2 {
		grid-column: 1 / -1;
		color: var(--err);
	}
</style>
