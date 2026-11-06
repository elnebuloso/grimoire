<script lang="ts">
	import { enhance } from '$app/forms';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import ChoiceField from './ChoiceField.svelte';
	import ConfirmDialog from './ConfirmDialog.svelte';
	import DateTime from './DateTime.svelte';
	import DescriptionList from './DescriptionList.svelte';
	import FormError from './FormError.svelte';
	import FormSection from './FormSection.svelte';
	import NameField from './NameField.svelte';
	import ScheduleField from './ScheduleField.svelte';
	import TextAreaField from './TextAreaField.svelte';
	import TextField from './TextField.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { markRefusal, submitWithToast, type Refusal, type SubmitResult } from '#lib/forms.js';
	import { MAX_NAME_LENGTH } from '#lib/slug.js';
	import type { SourceFields } from '#lib/source-fields.js';

	/**
	 * The settings of a source, new or saved, posting to `?/save`, with a connection test posting
	 * to `?/test`. Saving a source as public asks first. An entered token comes back only
	 * encrypted, in `encryptedToken`, and the field is emptied after every answer.
	 */
	let {
		values,
		refusal,
		access,
		source,
		globalSchedule,
		timeZone,
		nextCheck,
		instanceTitle
	}: {
		values: SourceFields & { removeToken: boolean; encryptedToken: string };
		/** Why the last save or test was refused; `overlap` asks for the confirmation box. */
		refusal?: Refusal & { overlap?: boolean };
		/** The answer of the last connection test. */
		access?: { message: string } | Refusal;
		/** The saved source; undefined for a new one. */
		source?: { name: string; visibility: string; hasToken: boolean };
		globalSchedule: string;
		timeZone: string;
		/** When polling checks the source next; undefined while it is paused. */
		nextCheck?: string;
		instanceTitle: string;
	} = $props();

	let testPending = $state(false);

	// Saving a source as public opens it to everyone: asked once, then the same submit again.
	let askPublic = $state(false);
	let publicConfirmed = false;
	let pendingSubmitter: HTMLElement | null = null;
	let formElement = $state<HTMLFormElement>();

	// Runs before the submit handler of `enhance`, which it keeps from posting until confirmed.
	function confirmPublic(event: SubmitEvent) {
		const testing = event.submitter?.getAttribute('formaction') === '?/test';
		const data = new FormData(event.currentTarget as HTMLFormElement, event.submitter);
		const becomesPublic = data.get('visibility') === 'public' && source?.visibility !== 'public';
		if (testing || publicConfirmed || !becomesPublic) {
			publicConfirmed = false;
			return;
		}
		event.preventDefault();
		event.stopImmediatePropagation();
		pendingSubmitter = event.submitter;
		askPublic = true;
	}

	const overlapAsked = $derived(refusal?.overlap === true);

	// A refusal marks the field it is about, which points to the message: the path, which only the
	// Git server can refuse, has its message next to it; the others at the top.
	const ownMessage = (field: string | undefined) => (field === 'path' ? 'path-error' : undefined);
	const invalid = (field: string, hintId?: string) =>
		markRefusal(refusal, field, ownMessage(field) ?? 'source-error', hintId);
</script>

<!-- What each Git host calls the token the access section asks for. -->
{#snippet gitlab()}{m.source_token_gitlab()} <code>read_repository</code>{/snippet}
{#snippet github()}{m.source_token_github()} <code>Contents: read-only</code>{/snippet}

<!-- In place: the connection test answers without reloading what was typed and where it was
scrolled to; saving a new source leads to it. -->
<form
	class="source-form"
	method="post"
	action="?/save"
	bind:this={formElement}
	onsubmit={confirmPublic}
	use:enhance={(input) => {
		const testing = input.action.search === '?/test';
		const isNew = !source;
		const name = String(input.formData.get('name'));
		if (testing) testPending = true;
		const submit = submitWithToast({
			success: (result) => {
				if (testing) return undefined;
				if (isNew) return m.source_created({ name });
				const reindexing = result.type === 'success' && result.data?.reindexing === true;
				return reindexing ? m.source_saved_sync({ name }) : m.source_saved({ name });
			}
		})(input) as SubmitResult;
		return async (output) => {
			await submit(output);
			testPending = false;
			// The answer carries an entered token back only encrypted; as after a reload, the page
			// keeps no plain copy of it.
			const token = input.formElement.elements.namedItem('token');
			if (token instanceof HTMLInputElement) token.value = '';
		};
	}}
>
	<!-- Enter in a field submits with the first submit button: saving, not the connection test
	further down. -->
	<button class="default-submit" tabindex="-1" aria-hidden="true"></button>
	<FormError
		message={overlapAsked || ownMessage(refusal?.field) ? undefined : refusal?.error}
		id="source-error"
	/>
	<FormSection title={m.source_section_general()}>
		<div class="fields">
			{#if source}
				<TextField
					label={m.field_name()}
					name="name"
					required
					maxlength={MAX_NAME_LENGTH}
					value={values.name}
					{...invalid('name')}
				/>
			{:else}
				<NameField label={m.field_name()} name="name" value={values.name} {...invalid('name')} />
			{/if}
			<TextField label={m.field_description()} name="description" value={values.description} />
		</div>
		<TextField
			label={m.field_docs_url()}
			name="docsUrl"
			type="url"
			value={values.docsUrl}
			{...invalid('docsUrl')}
		/>
	</FormSection>
	<FormSection title={m.source_section_repository()} lead={m.source_section_repository_lead()}>
		<div class="stacked">
			<TextField
				label={m.field_git_url()}
				name="gitUrl"
				type="url"
				required
				value={values.gitUrl}
				{...invalid('gitUrl', 'git-url-hint')}
			/>
			<p class="hint" id="git-url-hint">{m.field_git_url_hint()}</p>
		</div>
		<div class="fields">
			<TextField
				label={m.field_branch()}
				name="branch"
				required
				value={values.branch}
				mono
				{...invalid('branch')}
			/>
			<div class="stacked">
				<TextField
					label={m.field_path()}
					name="path"
					value={values.path}
					mono
					{...invalid('path')}
				/>
				<FormError
					message={refusal?.field === 'path' ? refusal.error : undefined}
					id="path-error"
				/>
			</div>
		</div>
		<TextAreaField label={m.field_exclusions()} name="exclusions" value={values.exclusions} />
	</FormSection>
	<FormSection title={m.source_section_access()} lead={m.source_section_access_lead()}>
		<DescriptionList
			items={[
				['GitLab', gitlab],
				['GitHub', github],
				['Forgejo', m.source_token_forgejo()]
			]}
		/>
		<div class="fields">
			<TextField label={m.field_username()} name="username" value={values.username} />
			<div class="stacked">
				<TextField
					label={values.encryptedToken
						? m.field_token_entered()
						: source?.hasToken
							? m.field_token_stored()
							: m.field_token_none_stored()}
					name="token"
					type="password"
					autocomplete="off"
					{...invalid('token')}
				/>
				{#if values.encryptedToken}
					<ChoiceField name="discardToken" label={m.field_remove_entered_token()} />
				{:else if source?.hasToken}
					<ChoiceField
						name="removeToken"
						checked={values.removeToken}
						label={m.field_remove_stored_token()}
					/>
				{/if}
			</div>
		</div>
		<input type="hidden" name="encryptedToken" value={values.encryptedToken} />
		{#if access}
			{#if 'error' in access}
				<p class="notice alert" role="alert">{access.error}</p>
			{:else}
				<p class="notice reachable" role="status">
					<CircleCheck size={18} aria-hidden="true" />
					{access.message}
				</p>
			{/if}
		{/if}
		<!-- `formnovalidate`: the connection can be tested before the source has a name. -->
		<button
			class="test"
			formaction="?/test"
			formnovalidate
			disabled={testPending}
			aria-busy={testPending}>{m.access_test()}</button
		>
	</FormSection>
	<FormSection title={m.source_section_schedule()}>
		<ScheduleField
			label={m.field_schedule({ schedule: globalSchedule })}
			name="schedule"
			value={values.schedule}
			{...invalid('schedule')}
			{globalSchedule}
			{timeZone}
		/>
		{#if nextCheck}
			<p class="hint">
				{m.source_next_check()}
				<DateTime value={nextCheck} {timeZone} />
			</p>
		{/if}
		<ChoiceField name="paused" checked={values.paused} label={m.field_paused()} />
		<fieldset>
			<legend>{m.visibility()}</legend>
			<ChoiceField
				type="radio"
				name="visibility"
				value="internal"
				checked={values.visibility === 'internal'}
				label={m.field_visibility_internal({ name: instanceTitle })}
			/>
			<ChoiceField
				type="radio"
				name="visibility"
				value="public"
				checked={values.visibility === 'public'}
				label={m.field_visibility_public({ name: instanceTitle })}
			/>
		</fieldset>
	</FormSection>
	{#if overlapAsked}
		<p class="notice warn" role="alert" id="overlap-warning">{refusal?.error}</p>
		<ChoiceField
			name="confirmOverlap"
			label={m.field_confirm_overlap()}
			aria-describedby="overlap-warning"
		/>
	{/if}
	<div class="actions">
		<button class="primary">{source ? m.save() : m.source_create()}</button>
	</div>
</form>
<ConfirmDialog
	bind:open={askPublic}
	title={m.source_public_title({ name: values.name || m.source_new() })}
	consequence={m.source_public_consequence({ instance: instanceTitle })}
	confirmLabel={m.source_public_confirm()}
	onconfirm={() => {
		askPublic = false;
		publicConfirmed = true;
		formElement?.requestSubmit(pendingSubmitter);
	}}
/>

<style>
	.source-form {
		display: grid;
		gap: var(--s5);
	}
	/* Out of sight and out of reach; it only takes the Enter of the form. */
	.default-submit {
		display: none;
	}
	.fields {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--s4);
	}
	.stacked {
		display: grid;
		gap: var(--s2);
	}
	.test {
		justify-self: start;
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s3);
	}
	.hint {
		color: var(--ink-2);
		font-size: var(--fs-3);
	}
	.reachable {
		display: flex;
		align-items: center;
		gap: var(--s2);
	}
	.reachable :global(svg) {
		flex: none;
		color: var(--ok);
	}
</style>
