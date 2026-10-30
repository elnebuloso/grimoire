<script lang="ts">
	import ChoiceField from '#lib/components/ChoiceField.svelte';
	import ConfirmForm from '#lib/components/ConfirmForm.svelte';
	import CopyButton from '#lib/components/CopyButton.svelte';
	import DateTime from '#lib/components/DateTime.svelte';
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
		{#each data.sources as source (source)}
			<ChoiceField
				name="sources"
				value={source}
				checked={access.sources.includes(source)}
				label={source}
			/>
		{/each}
	</fieldset>
	<TextField
		label={m.apikeys_valid_until()}
		name="validUntil"
		type="date"
		min={data.today}
		value={access.validUntil}
	/>
{/snippet}

<h1>{m.api_keys()}</h1>

{#if form?.created}
	<p role="status">
		{m.apikeys_created({ name: form.created.name })}
		<output>{form.created.key}</output>
	</p>
	<p><CopyButton value={form.created.key} label={m.apikeys_copy()} /></p>
{/if}

{#if data.keys.length === 0}
	<p>{m.apikeys_none()}</p>
{:else}
	<ul>
		{#each data.keys as key (key.id)}
			<li>
				{key.name} – {key.sources === 'all'
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
				{#if form?.updated === key.id}
					<p role="status">{m.apikeys_updated({ name: key.name })}</p>
				{/if}
				<details open={form?.update?.id === key.id}>
					<summary>{m.apikeys_change_named({ name: key.name })}</summary>
					<form method="post" action="?/update">
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
				<ConfirmForm
					action="?/revoke"
					question={m.apikeys_revoke_question({ name: key.name })}
					label={m.apikeys_revoke()}
					buttonLabel={m.apikeys_revoke_named({ name: key.name })}
				>
					<input type="hidden" name="id" value={key.id} />
				</ConfirmForm>
			</li>
		{/each}
	</ul>
{/if}

<h2>{m.apikeys_new()}</h2>
<form method="post" action="?/create">
	<FormError message={form?.error} />
	<TextField label={m.field_name()} name="name" required value={values.name} />
	{@render accessFields(values)}
	<button>{m.apikeys_submit()}</button>
</form>
