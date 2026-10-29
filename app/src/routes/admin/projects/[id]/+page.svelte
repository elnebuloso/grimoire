<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const values = $derived(form?.values ?? data.project);
</script>

<p><a href={resolve('/admin')}>All projects</a></p>
<h1>Project {data.project.slug}</h1>

<form method="post" action="?/save">
	{#if form?.error}<p role="alert">{form.error}</p>{/if}
	<p><label>Slug <input name="slug" required value={values.slug} /></label></p>
	<p>
		<label>Short description <input name="description" value={values.description} /></label>
	</p>
	<button>Save</button>
</form>

<h2>Sources</h2>
{#if data.sources.length === 0}
	<p>No sources yet.</p>
{:else}
	<ul>
		{#each data.sources as source (source.id)}
			<li>
				<a
					href={resolve('/admin/projects/[id]/sources/[sourceId]', {
						id: String(data.project.id),
						sourceId: String(source.id)
					})}>{source.slug}</a
				>
				– {source.gitUrl}, branch {source.branch}, path {source.path ||
					'(whole repository)'}{source.paused ? ', paused' : ''}
			</li>
		{/each}
	</ul>
{/if}
<p>
	<a
		href={resolve('/admin/projects/[id]/sources/[sourceId]', {
			id: String(data.project.id),
			sourceId: 'new'
		})}>New source</a
	>
</p>

<h2>Delete</h2>
<form
	method="post"
	action="?/delete"
	onsubmit={(event) => {
		if (!confirm(`Delete project ${data.project.slug} with all its sources?`)) {
			event.preventDefault();
		}
	}}
>
	<button>Delete project and its sources</button>
</form>
