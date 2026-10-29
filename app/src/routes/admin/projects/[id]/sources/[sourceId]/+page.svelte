<script lang="ts">
	import { resolve } from '$app/paths';
	import ChoiceField from '#lib/components/ChoiceField.svelte';
	import ConfirmForm from '#lib/components/ConfirmForm.svelte';
	import DescriptionList from '#lib/components/DescriptionList.svelte';
	import FormError from '#lib/components/FormError.svelte';
	import TextAreaField from '#lib/components/TextAreaField.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const values = $derived(
		form?.values ?? {
			slug: data.source?.slug ?? '',
			gitUrl: data.source?.gitUrl ?? '',
			branch: data.source?.branch ?? 'main',
			path: data.source?.path ?? 'docs/',
			exclusions: data.source?.exclusions.join('\n') ?? '',
			schedule: data.source?.schedule ?? '',
			paused: data.source?.paused ?? false,
			username: data.source?.username ?? '',
			removeToken: false
		}
	);
</script>

<p>
	<a href={resolve('/admin/projects/[id]', { id: String(data.project.id) })}
		>{m.project_title({ slug: data.project.slug })}</a
	>
</p>
<h1>{data.source ? m.source_title({ slug: data.source.slug }) : m.project_new_source()}</h1>

{#if data.source && data.status}
	{@const sourcePage = resolve('/admin/projects/[id]/sources/[sourceId]', {
		id: String(data.project.id),
		sourceId: String(data.source.id)
	})}
	<h2>{m.source_status()}</h2>
	<form method="post" action="?/sync">
		<button>{m.source_sync_now()}</button>
	</form>
	{#if form?.sync}
		<p role="status">
			{#if form.sync.status === 'failed'}
				{m.source_sync_failed({ error: form.sync.error })}
			{:else if form.sync.status === 'synced'}
				{m.source_synced({ commit: form.sync.commit, pages: form.sync.pages })}
			{:else}
				{m.source_unchanged({ commit: form.sync.commit })}
			{/if}
		</p>
	{/if}
	<DescriptionList
		items={[
			[m.source_polling(), data.source.paused ? m.source_polling_paused() : m.active()],
			[m.source_last_check(), data.status.lastCheckedAt ?? m.never()],
			[m.source_last_sync(), data.status.lastSyncedAt ?? m.never()],
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
		{#if data.preview.markdown}
			<p>{m.source_preview_intro_before()} <code>read</code> {m.source_preview_intro_after()}</p>
			<pre>{data.preview.markdown}</pre>
		{:else}
			<p>{m.source_preview_missing({ file: data.preview.file })}</p>
		{/if}
	{/if}

	<h2>{m.source_settings()}</h2>
{/if}

<form method="post" action="?/save">
	<FormError message={form?.error} />
	<TextField label={m.field_slug()} name="slug" required value={values.slug} />
	<TextField label={m.field_git_url()} name="gitUrl" type="url" required value={values.gitUrl} />
	<TextField label={m.field_branch()} name="branch" required value={values.branch} />
	<TextField label={m.field_path()} name="path" value={values.path} />
	<TextAreaField label={m.field_exclusions()} name="exclusions" value={values.exclusions} />
	<TextField
		label={m.field_schedule({ schedule: data.globalSchedule })}
		name="schedule"
		value={values.schedule}
	/>
	{#if data.nextCheck}
		<p>{m.source_next_check()} <time>{data.nextCheck}</time></p>
	{/if}
	<ChoiceField name="paused" checked={values.paused} label={m.field_paused()} />
	<TextField label={m.field_username()} name="username" value={values.username} />
	<TextField
		label={data.source?.hasToken ? m.field_token_stored() : m.field_token_none_stored()}
		name="token"
		type="password"
		autocomplete="off"
	/>
	{#if data.source?.hasToken}
		<ChoiceField
			name="removeToken"
			checked={values.removeToken}
			label={m.field_remove_stored_token()}
		/>
	{/if}
	<button>{data.source ? m.save() : m.source_create()}</button>
</form>

{#if data.source}
	<h2>{m.delete()}</h2>
	<ConfirmForm
		action="?/delete"
		question={m.source_delete_question({ slug: data.source.slug })}
		label={m.source_delete()}
	/>
{/if}
