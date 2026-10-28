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
