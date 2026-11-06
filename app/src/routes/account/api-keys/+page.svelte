<script lang="ts">
	import { enhance, type SubmitFunction } from '$app/forms';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { tick } from 'svelte';
	import ChoiceField from '#lib/components/ChoiceField.svelte';
	import ConfirmAction from '#lib/components/ConfirmAction.svelte';
	import CopyButton from '#lib/components/CopyButton.svelte';
	import DateTime from '#lib/components/DateTime.svelte';
	import Dialog from '#lib/components/Dialog.svelte';
	import EmptyState from '#lib/components/EmptyState.svelte';
	import KeyScope from '#lib/components/KeyScope.svelte';
	import PageHead from '#lib/components/PageHead.svelte';
	import ShownOnce from '#lib/components/ShownOnce.svelte';
	import SourcePicker from '#lib/components/SourcePicker.svelte';
	import RequestsPerDay from '#lib/components/RequestsPerDay.svelte';
	import FormError from '#lib/components/FormError.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { formatDate } from '#lib/time-zone.js';
	import { submitWithToast } from '#lib/forms.js';
	import { connectCommand } from '#lib/connect-command.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	interface Access {
		allSources: boolean;
		sources: string[];
		validUntil: string;
	}
	type Key = PageProps['data']['keys'][number];

	const NEW_KEY = { name: '', allSources: true, sources: [] as string[], validUntil: '' };

	// Every refusal names one field: it is marked, points to the message and takes focus.
	const SCOPE_ERRORS = [m.apikeys_error_scope(), m.apikeys_error_source_gone()];
	const DATE_ERRORS = [m.apikeys_error_valid_until(), m.apikeys_error_valid_until_past()];
	const marked = (error: string | undefined, errorId: string, about: string[]) =>
		error && about.includes(error) ? { 'aria-invalid': true, 'aria-describedby': errorId } : {};

	async function focusRefusal() {
		await tick();
		document.querySelector<HTMLElement>('dialog[open] [aria-invalid="true"]')?.focus();
	}

	// Each opening starts a fresh form: what was typed or picked before is gone.
	let opened = $state(0);

	let creating = $state(false);
	let createValues = $state(NEW_KEY);
	let createError = $state<string>();
	let created = $state<{ name: string; key: string }>();

	function openNew() {
		createValues = NEW_KEY;
		createError = undefined;
		created = undefined;
		opened++;
		creating = true;
	}

	let editOpen = $state(false);
	let editing = $state<Key>();
	let editValues = $state<Access>(NEW_KEY);
	let editError = $state<string>();

	function openEdit(key: Key) {
		editing = key;
		editValues = {
			allSources: key.sources === 'all',
			sources: key.sources === 'all' ? [] : key.sources,
			validUntil: key.validUntil ?? ''
		};
		editError = undefined;
		opened++;
		editOpen = true;
	}

	/** Shows a refusal in the dialog; `onresult` takes the answer of a successful action. */
	function submitInDialog(
		toast: (data: Record<string, unknown> | undefined) => string | undefined,
		refused: (data: Record<string, unknown> | undefined) => void,
		onresult: (data: Record<string, unknown> | undefined) => void
	): SubmitFunction {
		const submit = submitWithToast({
			success: (result) => (result.type === 'success' ? toast(result.data) : undefined),
			onfailure: (data) => {
				refused(data);
				focusRefusal();
			}
		});
		return (input) => {
			const done = submit(input);
			return async (output) => {
				if (typeof done === 'function') await done(output);
				if (output.result.type === 'success') onresult(output.result.data);
			};
		};
	}

	const createSubmit = submitInDialog(
		(answer) => {
			const name = (answer?.created as { name: string } | undefined)?.name;
			return name ? m.apikeys_created_toast({ name }) : undefined;
		},
		(answer) => {
			createError = answer?.error as string | undefined;
			createValues = (answer?.values as typeof NEW_KEY | undefined) ?? createValues;
		},
		// The form gives way to the key: nothing is left to send a second time.
		(answer) => (created = answer?.created as { name: string; key: string })
	);

	const editSubmit = submitInDialog(
		() => (editing ? m.apikeys_updated({ name: editing.name }) : undefined),
		(answer) => {
			const update = answer?.update as { error: string; values: Access } | undefined;
			editError = update?.error;
			editValues = update?.values ?? editValues;
		},
		() => (editOpen = false)
	);
</script>

{#snippet accessFields(access: Access, error: string | undefined, errorId: string)}
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
			{...marked(error, errorId, SCOPE_ERRORS)}
		/>
		<div class="sources">
			<SourcePicker
				sources={data.sources}
				selected={access.sources}
				label={m.apikeys_scope_selected_sources()}
			/>
		</div>
	</fieldset>
	<TextField
		label={m.apikeys_valid_until()}
		name="validUntil"
		type="date"
		min={data.today}
		value={access.validUntil}
		{...marked(error, errorId, DATE_ERRORS)}
	/>
{/snippet}

<PageHead title={m.api_keys_own()}>
	<p>
		{m.apikeys_lead_before()} <code>Authorization: Bearer &lt;key&gt;</code>{m.apikeys_lead_after()}
		<a href="{resolve('/')}#connect">{m.start_connect_heading()}</a>.
	</p>
</PageHead>

<!-- Set on the first login of a new account: the key is what it came for. -->
{#if page.url.searchParams.has('welcome')}
	<p class="notice" role="status">
		{m.apikeys_welcome({ name: page.data.instanceTitle })}
		<button type="button" aria-haspopup="dialog" onclick={openNew}
			>{m.apikeys_welcome_action()}</button
		>
	</p>
{/if}

<section class="sheet" aria-labelledby="keys">
	<div class="sheet-head">
		<h2 id="keys">{m.apikeys_list()}</h2>
		{#if data.keys.length > 0}
			<button type="button" class="primary" aria-haspopup="dialog" onclick={openNew}
				>{m.apikeys_new()}</button
			>
		{/if}
	</div>
	{#if data.keys.length === 0}
		<EmptyState text={m.apikeys_none()} action={{ label: m.apikeys_new(), onclick: openNew }} />
	{:else}
		<!-- role="list": WebKit drops the list role of a list without bullets. -->
		<ul class="keys" role="list">
			{#each data.keys as key (key.id)}
				<li>
					<div class="key">
						<div class="facts">
							<strong>{key.name}</strong>
							<p>
								<KeyScope
									allSources={key.sources === 'all'}
									slugs={key.sources === 'all' ? [] : key.sources}
								/>
							</p>
							<p class="meta">
								<span
									>{m.apikeys_created_at()}
									<DateTime value={key.createdAt} timeZone={data.timeZone} /></span
								>
								<span>
									{#if key.lastUsedAt}
										{m.apikeys_last_used()}
										<DateTime value={key.lastUsedAt} timeZone={data.timeZone} />
									{:else}
										{m.apikeys_never_used()}
									{/if}
								</span>
								{#if key.validUntil}
									<span class:expired={key.expired}
										>{key.expired
											? m.apikeys_expired({ date: formatDate(key.validUntil, getLocale()) })
											: m.apikeys_valid_until_date({
													date: formatDate(key.validUntil, getLocale())
												})}</span
									>
								{/if}
							</p>
							<RequestsPerDay days={key.requests} />
						</div>
						<div class="key-actions">
							<button
								type="button"
								aria-haspopup="dialog"
								aria-label={m.apikeys_edit_named({ name: key.name })}
								onclick={() => openEdit(key)}>{m.apikeys_edit()}</button
							>
							<ConfirmAction
								action="?/revoke"
								title={m.apikeys_revoke_title({ name: key.name })}
								consequence={m.apikeys_revoke_consequence()}
								danger
								label={m.apikeys_revoke()}
								buttonLabel={m.apikeys_revoke_named({ name: key.name })}
								success={m.apikeys_revoked({ name: key.name })}
							>
								<input type="hidden" name="id" value={key.id} />
							</ConfirmAction>
						</div>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<Dialog bind:open={creating} title={m.apikeys_new()}>
	{#if created}
		<p class="notice" role="status">{m.apikeys_created({ name: created.name })}</p>
		<ShownOnce value={created.key} copyLabel={m.apikeys_copy()} />
		<p>{m.apikeys_connect_intro()}</p>
		{@const command = connectCommand(data.origin, data.mcpName, created.key)}
		<pre><code>{command}</code></pre>
		<div><CopyButton value={command} label={m.start_connect_copy()} /></div>
	{:else}
		{#key opened}
			<form id="create-key" method="post" action="?/create" use:enhance={createSubmit}>
				<FormError message={createError} id="create-error" />
				<TextField
					label={m.field_name()}
					name="name"
					required
					value={createValues.name}
					mono
					{...marked(createError, 'create-error', [m.apikeys_error_name()])}
				/>
				{@render accessFields(createValues, createError, 'create-error')}
			</form>
		{/key}
	{/if}
	{#snippet actions()}
		{#if created}
			<button type="button" class="primary" onclick={() => (creating = false)}
				>{m.dialog_done()}</button
			>
		{:else}
			<button type="button" onclick={() => (creating = false)}>{m.dialog_cancel()}</button>
			<button class="primary" form="create-key">{m.apikeys_submit()}</button>
		{/if}
	{/snippet}
</Dialog>

<Dialog
	bind:open={editOpen}
	title={editing ? m.apikeys_edit_title({ name: editing.name }) : m.apikeys_edit()}
>
	{#if editing}
		{#key opened}
			<form id="edit-key" method="post" action="?/update" use:enhance={editSubmit}>
				<FormError message={editError} id="edit-error" />
				<input type="hidden" name="id" value={editing.id} />
				{@render accessFields(editValues, editError, 'edit-error')}
			</form>
		{/key}
	{/if}
	{#snippet actions()}
		<button type="button" onclick={() => (editOpen = false)}>{m.dialog_cancel()}</button>
		<button class="primary" form="edit-key">{m.apikeys_change_submit()}</button>
	{/snippet}
</Dialog>

<style>
	fieldset {
		display: grid;
		gap: var(--s2);
	}
	.sources {
		padding-inline-start: 30px;
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
	.facts {
		display: grid;
		flex: 1 1 20rem;
		gap: var(--s1);
	}
	.facts strong {
		font-family: var(--mono);
		font-weight: 500;
	}
	/* Created, last used and validity as separate facts on one line, wrapping between them. */
	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0 var(--s4);
		color: var(--ink-2);
		font-size: 13px;
	}
	.expired {
		color: var(--err);
		font-weight: 500;
	}
	.key-actions {
		display: flex;
		gap: var(--s2);
	}
	form {
		display: grid;
		gap: var(--s4);
	}
	pre {
		margin: 0;
		overflow-x: auto;
	}
</style>
