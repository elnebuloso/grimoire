<script lang="ts">
	import { resolve } from '$app/paths';
	import ChoiceField from '#lib/components/ChoiceField.svelte';
	import ConfirmForm from '#lib/components/ConfirmForm.svelte';
	import DateTime from '#lib/components/DateTime.svelte';
	import DescriptionList from '#lib/components/DescriptionList.svelte';
	import FormError from '#lib/components/FormError.svelte';
	import NameField from '#lib/components/NameField.svelte';
	import SlugChangeForm from '#lib/components/SlugChangeForm.svelte';
	import TextAreaField from '#lib/components/TextAreaField.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { MAX_NAME_LENGTH } from '#lib/slug.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const values = $derived(
		form?.values ?? {
			name: data.source?.name ?? '',
			gitUrl: data.source?.gitUrl ?? '',
			docsUrl: data.source?.docsUrl ?? '',
			branch: data.source?.branch ?? 'main',
			path: data.source?.path ?? 'docs/',
			exclusions: data.source?.exclusions.join('\n') ?? '',
			schedule: data.source?.schedule ?? '',
			paused: data.source?.paused ?? false,
			username: data.source?.username ?? '',
			removeToken: false,
			encryptedToken: ''
		}
	);
</script>

<p>
	<a href={resolve('/manage/projects/[id]', { id: String(data.project.id) })}
		>{m.project_title({ name: data.project.name })}</a
	>
</p>
<h1>{data.source ? m.source_title({ name: data.source.name }) : m.project_new_source()}</h1>
{#if data.source?.docsUrl}
	<p><a href={data.source.docsUrl} rel="external">{m.source_docs_link()}</a></p>
{/if}

{#if data.source && data.status}
	{@const sourcePage = resolve('/manage/projects/[id]/sources/[sourceId]', {
		id: String(data.project.id),
		sourceId: String(data.source.id)
	})}
	<h2>{m.source_status()}</h2>
	<form method="post" action="?/sync">
		<button>{m.source_sync_now()}</button>
	</form>
	{#if data.syncPending}
		<p role="status">{m.source_sync_pending()}</p>
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
			[m.source_commit(), data.status.lastCommit ?? m.none()],
			[
				m.source_totals(),
				`${data.status.totals.pages}, ${data.status.totals.snippets}, ${data.status.totals.tokens}`
			]
		]}
	/>
	{#if data.status.error}
		<h3>{m.source_error()}</h3>
		<p role="alert">{data.status.error}</p>
	{/if}
	{#if data.status.warnings.length > 0}
		<h3>{m.source_warnings()}</h3>
		<ul>
			{#each data.status.warnings as warning, index (index)}
				<li>{warning}</li>
			{/each}
		</ul>
	{/if}
	{#if data.status.deadLinks.length > 0}
		<h3>{m.dead_links()}</h3>
		<ul>
			{#each data.status.deadLinks as link, index (index)}
				<li>{link.file}{link.anchor ? `#${link.anchor}` : ''} → {link.target}</li>
			{/each}
		</ul>
	{/if}
	{#if data.status.pages.length > 0}
		<h3>{m.pages()}</h3>
		<ul>
			{#each data.status.pages as page (page.file)}
				<li>
					<a href="{sourcePage}?preview={encodeURIComponent(page.file)}">{page.file}</a>
					– {m.source_page_line({
						title: page.title,
						snippets: page.snippets,
						tokens: page.tokens
					})}
				</li>
			{/each}
		</ul>
	{/if}
	{#if data.preview}
		<h3>{m.source_preview_title({ file: data.preview.file })}</h3>
		{#if data.preview.snippets?.length === 0}
			<p>{m.source_preview_no_snippets()}</p>
		{:else if data.preview.snippets}
			<p>{m.source_preview_intro_before()} <code>read</code> {m.source_preview_intro_after()}</p>
			<ol>
				{#each data.preview.snippets as snippet, index (index)}
					<li>
						<h4>{snippet.titlePath.join(' › ')}</h4>
						<p>
							<code>{snippet.id}</code> – {m.source_preview_snippet_tokens({
								tokens: snippet.tokens
							})}
						</p>
						<pre>{snippet.markdown}</pre>
					</li>
				{/each}
			</ol>
		{:else}
			<p>{m.source_preview_missing({ file: data.preview.file })}</p>
		{/if}
	{/if}

	<h2>{m.source_settings()}</h2>
{/if}

<form method="post" action="?/save">
	<FormError message={form?.error} />
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
	<TextField label={m.field_git_url()} name="gitUrl" type="url" required value={values.gitUrl} />
	<TextField label={m.field_docs_url()} name="docsUrl" type="url" value={values.docsUrl} />
	<TextField label={m.field_branch()} name="branch" required value={values.branch} />
	<TextField label={m.field_path()} name="path" value={values.path} />
	<TextAreaField label={m.field_exclusions()} name="exclusions" value={values.exclusions} />
	<TextField
		label={m.field_schedule({ schedule: data.globalSchedule })}
		name="schedule"
		value={values.schedule}
	/>
	{#if data.nextCheck}
		<p>{m.source_next_check()} <DateTime value={data.nextCheck} timeZone={data.timeZone} /></p>
	{/if}
	<ChoiceField name="paused" checked={values.paused} label={m.field_paused()} />
	<TextField label={m.field_username()} name="username" value={values.username} />
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
	<input type="hidden" name="encryptedToken" value={values.encryptedToken} />
	{#if data.source?.hasToken}
		<ChoiceField
			name="removeToken"
			checked={values.removeToken}
			label={m.field_remove_stored_token()}
		/>
	{/if}
	{#if form?.access}
		<p role={form.access.ok ? 'status' : 'alert'}>{form.access.message}</p>
	{/if}
	<!-- Saving comes first: Enter submits with the first button of a form. -->
	<button>{data.source ? m.save() : m.source_create()}</button>
	<button formaction="?/test">{m.access_test()}</button>
</form>

{#if data.source}
	<h2>{m.slug_change_heading()}</h2>
	<SlugChangeForm
		current={data.source.slug}
		effects={m.slug_change_source_effects({ slug: data.source.slug })}
		value={form?.slugValues?.slug}
		error={form?.slugError}
		changed={form?.slugChanged}
	/>

	<h2>{m.delete()}</h2>
	<ConfirmForm
		action="?/delete"
		question={m.source_delete_question({ name: data.source.name })}
		label={m.source_delete()}
	/>
{/if}
