<script lang="ts">
	import { resolve } from '$app/paths';
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
	<dl>
		<dt>Polling</dt>
		<dd>{data.source.paused ? 'paused; only "Sync now" syncs this source' : 'active'}</dd>
		<dt>Last check</dt>
		<dd>{data.status.lastCheckedAt ?? 'never'}</dd>
		<dt>Last sync</dt>
		<dd>{data.status.lastSyncedAt ?? 'never'}</dd>
		<dt>Commit</dt>
		<dd>{data.status.lastCommit ?? 'none'}</dd>
		<dt>Pages, snippets, tokens</dt>
		<dd>{data.status.totals.pages}, {data.status.totals.snippets}, {data.status.totals.tokens}</dd>
	</dl>
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
	{#if form?.error}<p role="alert">{form.error}</p>{/if}
	<p><label>Slug <input name="slug" required value={values.slug} /></label></p>
	<p>
		<label>
			Git URL (HTTPS)
			<input name="gitUrl" type="url" required value={values.gitUrl} />
		</label>
	</p>
	<p><label>Branch <input name="branch" required value={values.branch} /></label></p>
	<p>
		<label>
			Path in the repository (empty for the whole repository)
			<input name="path" value={values.path} />
		</label>
	</p>
	<p>
		<label>
			Exclusions: glob patterns relative to the repository root, one per line
			<textarea name="exclusions">{values.exclusions}</textarea>
		</label>
	</p>
	<p>
		<label>
			Schedule: cron expression with five fields, empty for the global one ({data.globalSchedule})
			<input name="schedule" value={values.schedule} />
		</label>
	</p>
	{#if data.nextCheck}
		<p>Next check: <time>{data.nextCheck}</time></p>
	{/if}
	<p>
		<label>
			<input name="paused" type="checkbox" checked={values.paused} /> Paused: polling skips this source,
			only "Sync now" syncs it
		</label>
	</p>
	<p><label>Username <input name="username" value={values.username} /></label></p>
	<p>
		<label>
			Access token ({data.source?.hasToken ? 'stored; leave empty to keep it' : 'none stored'})
			<input name="token" type="password" autocomplete="off" />
		</label>
	</p>
	{#if data.source?.hasToken}
		<p>
			<label>
				<input name="removeToken" type="checkbox" checked={values.removeToken} /> Remove the stored token
			</label>
		</p>
	{/if}
	<button>{data.source ? 'Save' : 'Create source'}</button>
</form>

{#if data.source}
	<h2>Delete</h2>
	<form
		method="post"
		action="?/delete"
		onsubmit={(event) => {
			if (!confirm(`Delete source ${data.source?.slug} and its index?`)) event.preventDefault();
		}}
	>
		<button>Delete source</button>
	</form>
{/if}
