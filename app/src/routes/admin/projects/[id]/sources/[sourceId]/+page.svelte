<script lang="ts">
	import { resolve } from '$app/paths';
	import ChoiceField from '#lib/components/ChoiceField.svelte';
	import ConfirmForm from '#lib/components/ConfirmForm.svelte';
	import DescriptionList from '#lib/components/DescriptionList.svelte';
	import FormError from '#lib/components/FormError.svelte';
	import TextAreaField from '#lib/components/TextAreaField.svelte';
	import TextField from '#lib/components/TextField.svelte';
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
		>Project {data.project.slug}</a
	>
</p>
<h1>{data.source ? `Source ${data.source.slug}` : 'New source'}</h1>

{#if data.source && data.status}
	{@const sourcePage = resolve('/admin/projects/[id]/sources/[sourceId]', {
		id: String(data.project.id),
		sourceId: String(data.source.id)
	})}
	<h2>Status</h2>
	<form method="post" action="?/sync">
		<button>Sync now</button>
	</form>
	{#if form?.sync}
		<p role="status">
			{#if form.sync.status === 'failed'}
				Sync failed: {form.sync.error}
			{:else if form.sync.status === 'synced'}
				Synced commit {form.sync.commit}: {form.sync.pages} pages.
			{:else}
				Unchanged at commit {form.sync.commit}.
			{/if}
		</p>
	{/if}
	<DescriptionList
		items={[
			['Polling', data.source.paused ? 'paused; only "Sync now" syncs this source' : 'active'],
			['Last check', data.status.lastCheckedAt ?? 'never'],
			['Last sync', data.status.lastSyncedAt ?? 'never'],
			['Commit', data.status.lastCommit ?? 'none'],
			[
				'Pages, snippets, tokens',
				`${data.status.totals.pages}, ${data.status.totals.snippets}, ${data.status.totals.tokens}`
			]
		]}
	/>
	{#if data.status.error}
		<h3>Error</h3>
		<p role="alert">{data.status.error}</p>
	{/if}
	{#if data.status.warnings.length > 0}
		<h3>Warnings</h3>
		<ul>
			{#each data.status.warnings as warning, index (index)}
				<li>{warning}</li>
			{/each}
		</ul>
	{/if}
	{#if data.status.deadLinks.length > 0}
		<h3>Dead links</h3>
		<ul>
			{#each data.status.deadLinks as link, index (index)}
				<li>{link.file}{link.anchor ? `#${link.anchor}` : ''} → {link.target}</li>
			{/each}
		</ul>
	{/if}
	{#if data.status.pages.length > 0}
		<h3>Pages</h3>
		<ul>
			{#each data.status.pages as page (page.file)}
				<li>
					<a href="{sourcePage}?preview={encodeURIComponent(page.file)}">{page.file}</a>
					– {page.title}: {page.snippets} snippets, {page.tokens} tokens
				</li>
			{/each}
		</ul>
	{/if}
	{#if data.preview}
		<h3>Preview of {data.preview.file}</h3>
		{#if data.preview.markdown}
			<p>As the agent operation <code>read</code> returns it:</p>
			<pre>{data.preview.markdown}</pre>
		{:else}
			<p>This source has no page {data.preview.file}.</p>
		{/if}
	{/if}

	<h2>Settings</h2>
{/if}

<form method="post" action="?/save">
	<FormError message={form?.error} />
	<TextField label="Slug" name="slug" required value={values.slug} />
	<TextField label="Git URL (HTTPS)" name="gitUrl" type="url" required value={values.gitUrl} />
	<TextField label="Branch" name="branch" required value={values.branch} />
	<TextField
		label="Path in the repository (empty for the whole repository)"
		name="path"
		value={values.path}
	/>
	<TextAreaField
		label="Exclusions: glob patterns relative to the repository root, one per line"
		name="exclusions"
		value={values.exclusions}
	/>
	<TextField
		label="Schedule: cron expression with five fields, empty for the global one ({data.globalSchedule})"
		name="schedule"
		value={values.schedule}
	/>
	{#if data.nextCheck}
		<p>Next check: <time>{data.nextCheck}</time></p>
	{/if}
	<ChoiceField
		name="paused"
		checked={values.paused}
		label="Paused: polling skips this source, only &quot;Sync now&quot; syncs it"
	/>
	<TextField label="Username" name="username" value={values.username} />
	<TextField
		label="Access token ({data.source?.hasToken
			? 'stored; leave empty to keep it'
			: 'none stored'})"
		name="token"
		type="password"
		autocomplete="off"
	/>
	{#if data.source?.hasToken}
		<ChoiceField name="removeToken" checked={values.removeToken} label="Remove the stored token" />
	{/if}
	<button>{data.source ? 'Save' : 'Create source'}</button>
</form>

{#if data.source}
	<h2>Delete</h2>
	<ConfirmForm
		action="?/delete"
		question="Delete source {data.source.slug} and its index?"
		label="Delete source"
	/>
{/if}
