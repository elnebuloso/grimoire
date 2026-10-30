<script lang="ts">
	import ChoiceField from '#lib/components/ChoiceField.svelte';
	import ConfirmForm from '#lib/components/ConfirmForm.svelte';
	import CopyButton from '#lib/components/CopyButton.svelte';
	import DateTime from '#lib/components/DateTime.svelte';
	import PageHead from '#lib/components/PageHead.svelte';
	import FormError from '#lib/components/FormError.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { formatDate } from '#lib/time-zone.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	interface Access {
		allSources: boolean;
		sources: string[];
		validUntil: string;
	}

	const values = $derived(
		form?.values ?? { name: '', allSources: true, sources: [] as string[], validUntil: '' }
	);
</script>

{#snippet accessFields(access: Access)}
	<fieldset>
		<legend>{m.apikeys_scope()}</legend>
		<ChoiceField
			type="radio"
			name="scope"
			value="all"
			checked={access.allSources}
			label={m.apikeys_scope_all()}
		/>
		<ChoiceField
			type="radio"
			name="scope"
			value="selected"
			checked={!access.allSources}
			label={m.apikeys_scope_selected()}
		/>
		<div class="sources">
			{#each data.sources as source (source)}
				<ChoiceField
					name="sources"
					value={source}
					checked={access.sources.includes(source)}
					label={source}
					mono
				/>
			{/each}
		</div>
	</fieldset>
	<TextField
		label={m.apikeys_valid_until()}
		name="validUntil"
		type="date"
		min={data.today}
		value={access.validUntil}
	/>
{/snippet}

<PageHead title={m.api_keys()} />

{#if form?.created}
	<section class="sheet">
		<p class="notice" role="status">{m.apikeys_created({ name: form.created.name })}</p>
		<div class="secret">
			<output>{form.created.key}</output>
			<CopyButton value={form.created.key} label={m.apikeys_copy()} />
		</div>
	</section>
{/if}

<section class="sheet">
	{#if data.keys.length === 0}
		<p class="muted">{m.apikeys_none()}</p>
	{:else}
		<ul class="keys">
			{#each data.keys as key (key.id)}
				<li>
					<div class="key">
						<p>
							<strong>{key.name}</strong> – {key.sources === 'all'
								? m.apikeys_all_sources()
								: key.sources.join(', ') || m.apikeys_no_sources()}, {m.apikeys_created_at()}
							<DateTime value={key.createdAt} timeZone={data.timeZone} />,
							{#if key.lastUsedAt}
								{m.apikeys_last_used()} <DateTime value={key.lastUsedAt} timeZone={data.timeZone} />
							{:else}
								{m.apikeys_never_used()}
							{/if}
							{#if key.validUntil}
								– {key.expired
									? m.apikeys_expired({ date: formatDate(key.validUntil, getLocale()) })
									: m.apikeys_valid_until_date({ date: formatDate(key.validUntil, getLocale()) })}
							{/if}
						</p>
						<ConfirmForm
							action="?/revoke"
							question={m.apikeys_revoke_question({ name: key.name })}
							label={m.apikeys_revoke()}
							buttonLabel={m.apikeys_revoke_named({ name: key.name })}
						>
							<input type="hidden" name="id" value={key.id} />
						</ConfirmForm>
					</div>
					{#if form?.updated === key.id}
						<p class="notice" role="status">{m.apikeys_updated({ name: key.name })}</p>
					{/if}
					<details open={form?.update?.id === key.id}>
						<summary>{m.apikeys_change_named({ name: key.name })}</summary>
						<form class="inset" method="post" action="?/update">
							<FormError message={form?.update?.id === key.id ? form.update.error : undefined} />
							<input type="hidden" name="id" value={key.id} />
							{@render accessFields(
								form?.update?.id === key.id
									? form.update.values
									: {
											allSources: key.sources === 'all',
											sources: key.sources === 'all' ? [] : key.sources,
											validUntil: key.validUntil ?? ''
										}
							)}
							<button>{m.apikeys_change_submit()}</button>
						</form>
					</details>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<section class="sheet new" aria-labelledby="new-key">
	<h2 id="new-key">{m.apikeys_new()}</h2>
	<form method="post" action="?/create">
		<FormError message={form?.error} />
		<TextField label={m.field_name()} name="name" required value={values.name} mono />
		{@render accessFields(values)}
		<button class="primary">{m.apikeys_submit()}</button>
	</form>
</section>

<style>
	fieldset {
		display: grid;
		gap: var(--s2);
	}
	.sources {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s2) var(--s5);
		padding-inline-start: 30px;
	}
	/* The key is shown once: it sits sunk in a well, dashed, to be selected or copied. */
	.secret {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--s3);
		padding: var(--s4);
		background: var(--well);
		border-radius: var(--r-control);
		box-shadow: var(--sink);
	}
	output {
		flex: 1 1 18rem;
		padding: var(--s3);
		font-family: var(--mono);
		font-size: 14px;
		background: var(--sheet);
		border: 1px dashed var(--edge);
		border-radius: var(--r-control);
		overflow-wrap: anywhere;
		user-select: all;
	}
	.keys {
		display: grid;
		list-style: none;
	}
	.keys > li {
		display: grid;
		gap: var(--s3);
		padding: var(--s4) 0;
		border-top: 1px solid var(--line);
	}
	.keys > li:first-child {
		padding-top: 0;
		border-top: 0;
	}
	.keys > li:last-child {
		padding-bottom: 0;
	}
	.key {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--s3);
	}
	.key p {
		flex: 1 1 20rem;
	}
	.key strong {
		font-family: var(--mono);
		font-weight: 500;
	}
	details[open] > summary {
		margin-bottom: var(--s3);
	}
	.inset {
		padding: var(--s4);
		background: var(--well);
		border-radius: var(--r-control);
		box-shadow: var(--sink);
	}
	.inset :global(input:not([type='checkbox'], [type='radio'], :focus-visible)) {
		background: var(--sheet);
	}
	.new {
		max-width: 40rem;
	}
</style>
