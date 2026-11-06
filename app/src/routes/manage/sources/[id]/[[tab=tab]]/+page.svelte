<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto, refreshAll } from '$app/navigation';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import { resolve } from '$app/paths';
	import ChoiceField from '#lib/components/ChoiceField.svelte';
	import ConfirmAction from '#lib/components/ConfirmAction.svelte';
	import ConfirmDialog from '#lib/components/ConfirmDialog.svelte';
	import DeadLinkList from '#lib/components/DeadLinkList.svelte';
	import DateTime from '#lib/components/DateTime.svelte';
	import DescriptionList from '#lib/components/DescriptionList.svelte';
	import FormError from '#lib/components/FormError.svelte';
	import NameField from '#lib/components/NameField.svelte';
	import PageHead from '#lib/components/PageHead.svelte';
	import PageList from '#lib/components/PageList.svelte';
	import TableScroll from '#lib/components/TableScroll.svelte';
	import TabNav from '#lib/components/TabNav.svelte';
	import TextAreaField from '#lib/components/TextAreaField.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { submitWithToast, type SubmitResult } from '#lib/forms.js';
	import { showToast } from '#lib/toasts.svelte.js';
	import { MAX_NAME_LENGTH, MAX_SLUG_LENGTH } from '#lib/slug.js';
	import { NEW_SOURCE_FIELDS, toSourceFields } from '#lib/source-fields.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let testPending = $state(false);

	// Saving a source as public opens it to everyone: asked once, then the same submit again.
	let askPublic = $state(false);
	let publicConfirmed = false;
	let pendingSave: { form: HTMLFormElement; submitter: HTMLElement | null } | undefined;
	const becomesPublic = (formData: FormData) =>
		formData.get('visibility') === 'public' && data.source?.visibility !== 'public';

	let newSlug = $state('');

	// Polls for the end of a queued sync, then refreshes the page data once and reports the outcome.
	// The poll does not keep an idle session alive; a page reload would. Every sub page shares this
	// component, so the poll goes on when the tab changes.
	const PENDING_REFRESH_MS = 2000;
	$effect(() => {
		if (!data.syncPending || !data.source) return;
		const id = data.source.id;
		const url = resolve('/manage/sources/[id]/sync-pending', { id: String(id) });
		const timer = setInterval(async () => {
			const response = await fetch(url);
			// An ended session answers with the login page, not JSON: the refresh then leads there.
			const { pending } = await response.json().catch(() => ({ pending: false }));
			if (pending) return;
			clearInterval(timer);
			await refreshAll();
			if (data.source?.id !== id) return;
			const name = data.source.name;
			if (data.status?.error) showToast(m.source_sync_failed({ name }));
			else showToast(m.source_sync_done({ name }));
		}, PENDING_REFRESH_MS);
		return () => clearInterval(timer);
	});

	// Links from before the sub pages pointed at sections of one page.
	$effect(() => {
		if (data.source && data.tab === 'status' && location.hash === '#settings') {
			goto(
				resolve('/manage/sources/[id]/[[tab=tab]]', {
					id: String(data.source.id),
					tab: 'settings'
				}),
				{
					replace: true
				}
			);
		}
	});

	const tabHref = (tab?: 'pages' | 'history' | 'settings') =>
		resolve('/manage/sources/[id]/[[tab=tab]]', { id: String(data.source!.id), tab });
	const tabs = $derived(
		data.source
			? [
					{ href: tabHref(), label: m.source_status(), current: data.tab === 'status' },
					{ href: tabHref('pages'), label: m.pages(), current: data.tab === 'pages' },
					{
						href: tabHref('history'),
						label: m.source_tab_history(),
						current: data.tab === 'history'
					},
					{
						href: tabHref('settings'),
						label: m.source_settings(),
						current: data.tab === 'settings'
					}
				]
			: []
	);

	// One word for the state of the source, the most pressing first.
	const badge = $derived.by(() => {
		if (data.syncPending) return { word: m.source_syncing(), tone: 'running' };
		if (data.status?.error) return { word: m.source_history_failed(), tone: 'error' };
		if (data.source?.paused) return { word: m.state_paused(), tone: 'muted' };
		if (!data.status?.lastSyncedAt) return { word: m.not_synced(), tone: 'muted' };
		return { word: m.source_history_synced(), tone: 'ok' };
	});

	const values = $derived(
		form?.values ?? {
			...(data.source ? toSourceFields(data.source) : NEW_SOURCE_FIELDS),
			removeToken: false,
			encryptedToken: ''
		}
	);
</script>

{#if data.source}
	<div class="head">
		<PageHead
			title={m.source_title({ name: data.source.name })}
			documentTitle={data.preview ? m.source_preview_title({ file: data.preview.file }) : undefined}
			back={{ href: resolve('/manage/sources'), label: m.all_sources_link() }}
		>
			<p class="facts">
				<code>{data.source.slug}</code>
				<span
					>{data.source.visibility === 'public'
						? m.visibility_public()
						: m.visibility_internal()}</span
				>
				<span class="badge {badge.tone}" aria-live="polite">{badge.word}</span>
				{#if data.source.docsUrl}
					<a href={data.source.docsUrl} rel="external">{m.source_docs_link()}</a>
				{/if}
			</p>
		</PageHead>
		<!-- Only the page data reloads: the settings form keeps what was entered, a tested token
		included, which following the redirect would drop. -->
		<form
			method="post"
			action="?/sync"
			use:enhance={submitWithToast({
				success: () => m.source_sync_started({ name: data.source!.name })
			})}
		>
			<button class="primary" disabled={data.syncPending} aria-busy={data.syncPending}
				>{m.source_sync_now()}</button
			>
		</form>
	</div>
	<TabNav label={m.source_tabs()} {tabs} />
{:else}
	<PageHead
		title={m.source_new()}
		back={{ href: resolve('/manage/sources'), label: m.all_sources_link() }}
	/>
{/if}

{#snippet settings()}
	<section class="sheet" aria-labelledby="settings">
		{#if data.source}<h2 id="settings">{m.source_settings()}</h2>{/if}
		<!-- In place: the connection test answers without reloading what was typed and where it
		was scrolled to; saving still leads to the source as before. -->
		<form
			method="post"
			action="?/save"
			use:enhance={(input) => {
				const testing = input.action.search === '?/test';
				if (!testing && !publicConfirmed && becomesPublic(input.formData)) {
					pendingSave = { form: input.formElement, submitter: input.submitter };
					askPublic = true;
					return input.cancel();
				}
				publicConfirmed = false;
				const isNew = !data.source;
				const name = String(input.formData.get('name'));
				if (testing) testPending = true;
				const submit = submitWithToast({
					success: () => {
						if (testing) return undefined;
						if (isNew) return m.source_created({ name });
						return data.syncPending ? m.source_saved_sync({ name }) : m.source_saved({ name });
					}
				})(input) as SubmitResult;
				return async (output) => {
					await submit(output);
					testPending = false;
					// The answer carries an entered token back only encrypted; as after a reload, the
					// page keeps no plain copy of it.
					const token = input.formElement.elements.namedItem('token');
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
				<div class="git-url">
					<TextField
						label={m.field_git_url()}
						name="gitUrl"
						type="url"
						required
						value={values.gitUrl}
						aria-describedby="git-url-hint"
					/>
					<p class="hint" id="git-url-hint">{m.field_git_url_hint()}</p>
				</div>
				<TextField label={m.field_docs_url()} name="docsUrl" type="url" value={values.docsUrl} />
				<TextField label={m.field_branch()} name="branch" required value={values.branch} mono />
				<div class="field-with-error">
					<TextField
						label={m.field_path()}
						name="path"
						value={values.path}
						mono
						{...form?.pathError ? { 'aria-invalid': true, 'aria-describedby': 'path-error' } : {}}
					/>
					<FormError message={form?.pathError} id="path-error" />
				</div>
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
			<fieldset>
				<legend>{m.visibility()}</legend>
				<ChoiceField
					type="radio"
					name="visibility"
					value="internal"
					checked={values.visibility === 'internal'}
					label={m.field_visibility_internal({ name: data.instanceTitle })}
				/>
				<ChoiceField
					type="radio"
					name="visibility"
					value="public"
					checked={values.visibility === 'public'}
					label={m.field_visibility_public({ name: data.instanceTitle })}
				/>
			</fieldset>
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
			{#if form?.overlap}
				<p class="notice warn" role="alert">{form.overlap}</p>
				<ChoiceField name="confirmOverlap" label={m.field_confirm_overlap()} />
			{/if}
			<div class="actions">
				<!-- Saving comes first: Enter submits with the first button of a form. -->
				<button class="primary">{data.source ? m.save() : m.source_create()}</button>
				<!-- `formnovalidate`: the connection can be tested before the source has a name. -->
				<button formaction="?/test" formnovalidate disabled={testPending} aria-busy={testPending}
					>{m.access_test()}</button
				>
			</div>
		</form>
	</section>
	<ConfirmDialog
		bind:open={askPublic}
		title={m.source_public_title({ name: values.name || m.source_new() })}
		consequence={m.source_public_consequence({ instance: data.instanceTitle })}
		confirmLabel={m.source_public_confirm()}
		onconfirm={() => {
			askPublic = false;
			publicConfirmed = true;
			pendingSave?.form.requestSubmit(pendingSave.submitter);
		}}
	/>
{/snippet}

{#if data.source && data.status}
	{#if data.tab === 'status'}
		<section class="sheet" aria-labelledby="status">
			<h2 id="status">{m.source_status()}</h2>
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
					[m.source_indexed_commit(), commit],
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
		</section>
	{:else if data.tab === 'pages'}
		<section class="sheet" aria-labelledby="pages">
			{#if data.preview}
				<a class="back" href={tabHref('pages')}>{m.source_all_pages()}</a>
				<h2 id="pages">{m.source_preview_title({ file: data.preview.file })}</h2>
				{#if data.preview.snippets?.length === 0}
					<p class="notice warn">{m.source_preview_no_snippets({ name: data.instanceTitle })}</p>
				{:else if data.preview.snippets}
					<p>
						{m.source_preview_intro_before()} <code>read</code>
						{m.source_preview_intro_after()}
					</p>
					<ol class="snippets">
						{#each data.preview.snippets as snippet, index (index)}
							<li>
								<h3>{snippet.titlePath.join(' › ')}</h3>
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
			{:else}
				<h2 id="pages">{m.pages()}</h2>
				{#if data.status.pages.length === 0}
					<p class="muted">{m.source_pages_none()}</p>
				{:else}
					<PageList pages={data.status.pages} sourceId={data.source.id} />
				{/if}
			{/if}
		</section>
	{:else if data.tab === 'history'}
		<section class="sheet" aria-labelledby="history">
			<h2 id="history">{m.source_history()}</h2>
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
								<th scope="col" class="error">{m.source_error()}</th>
							</tr>
						</thead>
						<tbody>
							{#each data.status.history as run, index (index)}
								<tr>
									<td class="when">
										{#if run.runs > 1}
											<span><DateTime value={run.startedAt} timeZone={data.timeZone} /> –</span>
											<span><DateTime value={run.finishedAt} timeZone={data.timeZone} /></span>
											<span class="runs">({m.source_history_runs({ runs: run.runs })})</span>
										{:else}
											<DateTime value={run.finishedAt} timeZone={data.timeZone} />
										{/if}
									</td>
									<td>
										<span class={run.outcome}
											>{run.outcome === 'synced'
												? m.source_history_synced()
												: run.outcome === 'unchanged'
													? m.source_history_unchanged()
													: m.source_history_failed()}</span
										>
									</td>
									<td
										>{#if run.commit}<code title={run.commit}>{run.commit.slice(0, 12)}</code
											>{/if}</td
									>
									<td class="error">{run.error ?? ''}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</TableScroll>
			{/if}
		</section>
	{:else}
		<div class="settings">{@render settings()}</div>
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
	{/if}
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
	.head {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: var(--s5);
	}
	.facts {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--s2) var(--s4);
	}
	.badge {
		padding: 0 var(--s2);
		border-radius: 999px;
		background: var(--well);
		font-size: 13px;
		font-weight: 500;
	}
	.badge.ok {
		color: var(--ok);
	}
	.badge.error {
		color: var(--err);
	}
	.badge.running {
		color: var(--accent);
	}
	.badge.muted {
		color: var(--ink-2);
	}
	.back {
		justify-self: start;
		font-size: 14px;
	}
	.settings,
	.new {
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
	.sheet:has(.snippets),
	.sheet[aria-labelledby='pages'],
	.sheet[aria-labelledby='status'] {
		display: grid;
		gap: var(--s4);
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
		grid-template-columns: 1fr 1fr;
		gap: var(--s4);
	}

	.git-url,
	.token,
	.field-with-error {
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
	/* A date breaks between its parts, never inside them: a run range is start, end and count on
	lines of their own instead of one word per line in a narrow column. */
	.when {
		white-space: nowrap;
	}
	.when span {
		display: block;
	}
	.runs {
		color: var(--ink-2);
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
	.snippets h3::before {
		content: counter(snippet) '  ';
		color: var(--ink-2);
		font-family: var(--mono);
		font-weight: 400;
	}
</style>
