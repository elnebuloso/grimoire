<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import { resolve } from '$app/paths';
	import ChoiceField from '#lib/components/ChoiceField.svelte';
	import ConfirmForm from '#lib/components/ConfirmForm.svelte';
	import DeadLinkList from '#lib/components/DeadLinkList.svelte';
	import DateTime from '#lib/components/DateTime.svelte';
	import DescriptionList from '#lib/components/DescriptionList.svelte';
	import FormError from '#lib/components/FormError.svelte';
	import NameField from '#lib/components/NameField.svelte';
	import PageHead from '#lib/components/PageHead.svelte';
	import PageList from '#lib/components/PageList.svelte';
	import SlugChangeForm from '#lib/components/SlugChangeForm.svelte';
	import TableScroll from '#lib/components/TableScroll.svelte';
	import TextAreaField from '#lib/components/TextAreaField.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { MAX_NAME_LENGTH } from '#lib/slug.js';
	import { NEW_SOURCE_FIELDS, toSourceFields } from '#lib/source-fields.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let testPending = $state(false);

	// Polls for the outcome of a queued sync; stops as soon as the sync is done.
	const PENDING_REFRESH_MS = 2000;
	$effect(() => {
		if (!data.syncPending) return;
		const timer = setInterval(() => invalidateAll(), PENDING_REFRESH_MS);
		return () => clearInterval(timer);
	});

	const values = $derived(
		form?.values ?? {
			...(data.source ? toSourceFields(data.source) : NEW_SOURCE_FIELDS),
			removeToken: false,
			encryptedToken: ''
		}
	);
</script>

<PageHead
	title={data.source ? m.source_title({ name: data.source.name }) : m.source_new()}
	documentTitle={data.preview ? m.source_preview_title({ file: data.preview.file }) : undefined}
	back={{ href: resolve('/manage'), label: m.all_sources_link() }}
>
	{#if data.source?.docsUrl}
		<p><a href={data.source.docsUrl} rel="external">{m.source_docs_link()}</a></p>
	{/if}
</PageHead>

{#snippet settings()}
	<section class="sheet" aria-labelledby="settings">
		{#if data.source}<h2 id="settings">{m.source_settings()}</h2>{/if}
		<!-- In place: the connection test answers without reloading what was typed and where it
		was scrolled to; saving still leads to the source as before. -->
		<form
			method="post"
			action="?/save"
			use:enhance={({ action, formElement }) => {
				const testing = action.search === '?/test';
				if (testing) testPending = true;
				return async ({ update }) => {
					await update({ reset: false, invalidateAll: !testing });
					testPending = false;
					// The answer carries an entered token back only encrypted; as after a reload, the
					// page keeps no plain copy of it.
					const token = formElement.elements.namedItem('token');
					if (token instanceof HTMLInputElement) token.value = '';
				};
			}}
		>
			<FormError message={form?.error} />
			<div class="fields">
				{#if data.source}
					<TextField
						label={m.field_name()}
						name="name"
						required
						maxlength={MAX_NAME_LENGTH}
						value={values.name}
					/>
				{:else}
					<NameField label={m.field_name()} name="name" value={values.name} />
				{/if}
				<TextField label={m.field_description()} name="description" value={values.description} />
				<TextField
					label={m.field_git_url()}
					name="gitUrl"
					type="url"
					required
					value={values.gitUrl}
				/>
				<TextField label={m.field_docs_url()} name="docsUrl" type="url" value={values.docsUrl} />
				<TextField label={m.field_branch()} name="branch" required value={values.branch} mono />
				<TextField label={m.field_path()} name="path" value={values.path} mono />
			</div>
			<TextAreaField label={m.field_exclusions()} name="exclusions" value={values.exclusions} />
			<TextField
				label={m.field_schedule({ schedule: data.globalSchedule })}
				name="schedule"
				value={values.schedule}
				mono
			/>
			{#if data.nextCheck}
				<p class="hint">
					{m.source_next_check()}
					<DateTime value={data.nextCheck} timeZone={data.timeZone} />
				</p>
			{/if}
			<ChoiceField
				name="public"
				checked={values.public}
				label={m.field_public({ name: data.instanceName })}
			/>
			<ChoiceField name="paused" checked={values.paused} label={m.field_paused()} />
			<div class="fields">
				<TextField label={m.field_username()} name="username" value={values.username} />
				<div class="token">
					<TextField
						label={values.encryptedToken
							? m.field_token_entered()
							: data.source?.hasToken
								? m.field_token_stored()
								: m.field_token_none_stored()}
						name="token"
						type="password"
						autocomplete="off"
					/>
					{#if values.encryptedToken}
						<ChoiceField name="discardToken" label={m.field_remove_entered_token()} />
					{:else if data.source?.hasToken}
						<ChoiceField
							name="removeToken"
							checked={values.removeToken}
							label={m.field_remove_stored_token()}
						/>
					{/if}
				</div>
			</div>
			<input type="hidden" name="encryptedToken" value={values.encryptedToken} />
			{#if form?.access}
				{#if 'error' in form.access}
					<p class="notice alert" role="alert">{form.access.error}</p>
				{:else}
					<p class="notice reachable" role="status">
						<CircleCheck size={18} aria-hidden="true" />
						{form.access.message}
					</p>
				{/if}
			{/if}
			<div class="actions">
				<!-- Saving comes first: Enter submits with the first button of a form. -->
				<button class="primary">{data.source ? m.save() : m.source_create()}</button>
				<button formaction="?/test" disabled={testPending} aria-busy={testPending}
					>{m.access_test()}</button
				>
			</div>
		</form>
	</section>
{/snippet}

{#if data.source && data.status}
	<div class="split">
		<section class="sheet" aria-labelledby="status">
			<div class="sheet-head">
				<h2 id="status">{m.source_status()}</h2>
				<form method="post" action="?/sync">
					<button class="primary">{m.source_sync_now()}</button>
				</form>
			</div>
			{#if data.syncPending}
				<p class="notice" role="status">
					{m.source_sync_pending()}
					<noscript>{m.source_sync_pending_reload()}</noscript>
				</p>
			{/if}
			{#snippet lastCheck()}
				{#if data.status?.lastCheckedAt}
					<DateTime value={data.status.lastCheckedAt} timeZone={data.timeZone} />
				{:else}
					{m.never()}
				{/if}
			{/snippet}
			{#snippet lastSync()}
				{#if data.status?.lastSyncedAt}
					<DateTime value={data.status.lastSyncedAt} timeZone={data.timeZone} />
				{:else}
					{m.never()}
				{/if}
			{/snippet}
			{#snippet commit()}
				{#if data.status?.lastCommit}<code>{data.status.lastCommit}</code>{:else}{m.none()}{/if}
			{/snippet}
			<DescriptionList
				items={[
					[
						m.source_polling(),
						data.source.paused
							? m.source_polling_paused()
							: data.syncsPaused
								? m.source_polling_all_paused()
								: m.active()
					],
					[m.source_last_check(), lastCheck],
					[m.source_last_sync(), lastSync],
					[m.source_commit(), commit],
					[
						m.source_totals(),
						`${data.status.totals.pages}, ${data.status.totals.snippets}, ${data.status.totals.tokens}`
					]
				]}
			/>
			{#if data.status.error}
				<div class="part">
					<h3>{m.source_error()}</h3>
					<p class="notice alert" role="alert">{data.status.error}</p>
				</div>
			{/if}
			{#if data.status.warnings.length > 0}
				<div class="part">
					<h3>{m.source_warnings()}</h3>
					<ul class="warnings">
						{#each data.status.warnings as warning, index (index)}
							<li><code>{warning}</code></li>
						{/each}
					</ul>
				</div>
			{/if}
			{#if data.status.deadLinks.length > 0}
				<div class="part">
					<h3>{m.dead_links()}</h3>
					<DeadLinkList links={data.status.deadLinks} />
				</div>
			{/if}
			<div class="part">
				<h3>{m.source_history()}</h3>
				{#if data.status.history.length === 0}
					<p class="muted">{m.source_history_none()}</p>
				{:else}
					<TableScroll label={m.source_history()}>
						<table>
							<thead>
								<tr>
									<th scope="col">{m.source_history_when()}</th>
									<th scope="col">{m.source_history_outcome()}</th>
									<th scope="col">{m.source_commit()}</th>
									<th scope="col">{m.source_error()}</th>
								</tr>
							</thead>
							<tbody>
								{#each data.status.history as run, index (index)}
									<tr>
										<td>
											{#if run.runs > 1}
												<DateTime value={run.startedAt} timeZone={data.timeZone} /> –
												<DateTime value={run.finishedAt} timeZone={data.timeZone} />
												({m.source_history_runs({ runs: run.runs })})
											{:else}
												<DateTime value={run.finishedAt} timeZone={data.timeZone} />
											{/if}
										</td>
										<td class={run.outcome}>
											{run.outcome === 'synced'
												? m.source_history_synced()
												: run.outcome === 'unchanged'
													? m.source_history_unchanged()
													: m.source_history_failed()}
										</td>
										<td
											>{#if run.commit}<code title={run.commit}>{run.commit.slice(0, 12)}</code
												>{/if}</td
										>
										<td>{run.error ?? ''}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</TableScroll>
				{/if}
			</div>
			{#if data.status.pages.length > 0}
				<div class="part">
					<h3>{m.pages()}</h3>
					<PageList pages={data.status.pages} sourceId={data.source.id} />
				</div>
			{/if}
			{#if data.preview}
				<div class="part">
					<h3>{m.source_preview_title({ file: data.preview.file })}</h3>
					{#if data.preview.snippets?.length === 0}
						<p class="notice warn">{m.source_preview_no_snippets({ name: data.instanceName })}</p>
					{:else if data.preview.snippets}
						<p>
							{m.source_preview_intro_before()} <code>read</code>
							{m.source_preview_intro_after()}
						</p>
						<ol class="snippets">
							{#each data.preview.snippets as snippet, index (index)}
								<li>
									<h4>{snippet.titlePath.join(' › ')}</h4>
									<p class="hint">
										<code>{snippet.id}</code> – {m.source_preview_snippet_tokens({
											tokens: snippet.tokens
										})}
									</p>
									<pre>{snippet.markdown}</pre>
								</li>
							{/each}
						</ol>
					{:else}
						<p class="notice warn">{m.source_preview_missing({ file: data.preview.file })}</p>
					{/if}
				</div>
			{/if}
		</section>

		<div class="settings">{@render settings()}</div>

		<!-- Rare and breaking: after the status on wide screens, so the column of Settings stays the
		only tall one beside it; after Settings when the columns stack. -->
		<div class="danger">
			<section class="sheet" aria-labelledby="slug">
				<h2 id="slug">{m.slug_change_heading()}</h2>
				<SlugChangeForm
					current={data.source.slug}
					effects={m.slug_change_source_effects({ slug: data.source.slug })}
					value={form?.slugValues?.slug}
					error={form?.slugError}
					changed={form?.slugChanged}
				/>
			</section>

			<section class="sheet" aria-labelledby="delete">
				<h2 id="delete">{m.delete()}</h2>
				<ConfirmForm
					action="?/delete"
					question={m.source_delete_question({ name: data.source.name })}
					label={m.source_delete()}
				/>
			</section>
		</div>
	</div>
{:else}
	<div class="new">{@render settings()}</div>
{/if}

<style>
	.reachable {
		display: flex;
		align-items: center;
		gap: var(--s2);
	}
	.reachable :global(svg) {
		flex: none;
		color: var(--ok);
	}
	.split,
	.danger {
		display: grid;
		gap: var(--s5);
		align-items: start;
		min-width: 0;
	}
	@media (min-width: 64rem) {
		.split {
			grid-template-columns: minmax(0, 1fr) 25rem;
			/* The second row takes what Settings is taller than the status, so the danger area
			follows the status directly. */
			grid-template-rows: auto 1fr;
			grid-template-areas:
				'status settings'
				'danger settings';
		}
		.split > .sheet {
			grid-area: status;
		}
		.settings {
			grid-area: settings;
		}
		.danger {
			grid-area: danger;
		}
	}
	/* The width of a single form: in the wide column the text would run past a readable line and
	the slug fields far past any slug. */
	.danger :global(form) {
		max-width: 30rem;
	}
	.new {
		max-width: 52rem;
	}
	.part {
		display: grid;
		gap: var(--s3);
		min-width: 0;
		padding-top: var(--s4);
		border-top: 1px solid var(--line);
	}
	.fields {
		display: grid;
		gap: var(--s4);
	}
	/* Two columns only where there is room: on the new-source page, not in the side column. */
	@media (min-width: 48rem) {
		.new .fields {
			grid-template-columns: 1fr 1fr;
		}
	}
	.token {
		display: grid;
		gap: var(--s2);
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s3);
	}
	.hint {
		color: var(--ink-2);
		font-size: 13px;
	}
	.warnings {
		display: grid;
		gap: var(--s2);
		list-style: none;
	}
	.warnings li {
		padding-inline-start: var(--s4);
		border-inline-start: 3px solid var(--warn);
		overflow-wrap: anywhere;
	}
	.warnings code {
		font-size: 13px;
	}
	td:has(code[title]),
	.synced,
	.unchanged,
	.failed {
		white-space: nowrap;
	}
	.synced {
		color: var(--ok);
		font-weight: 500;
	}
	.unchanged {
		color: var(--ink-2);
	}
	.failed {
		color: var(--err);
		font-weight: 600;
	}
	.snippets {
		display: grid;
		gap: var(--s5);
		list-style: none;
		counter-reset: snippet;
	}
	.snippets li {
		display: grid;
		gap: var(--s2);
		counter-increment: snippet;
	}
	.snippets h4::before {
		content: counter(snippet) '  ';
		color: var(--ink-2);
		font-family: var(--mono);
		font-weight: 400;
	}
</style>
