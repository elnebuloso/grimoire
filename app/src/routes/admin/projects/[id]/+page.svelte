<script lang="ts">
	import { resolve } from '$app/paths';
	import ConfirmForm from '#lib/components/ConfirmForm.svelte';
	import FormError from '#lib/components/FormError.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const values = $derived(form?.values ?? data.project);
</script>

<p><a href={resolve('/admin')}>All projects</a></p>
<h1>Project {data.project.slug}</h1>

<form method="post" action="?/save">
	<FormError message={form?.error} />
	<TextField label="Slug" name="slug" required value={values.slug} />
	<TextField label="Short description" name="description" value={values.description} />
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
<ConfirmForm
	action="?/delete"
	question="Delete project {data.project.slug} with all its sources?"
	label="Delete project and its sources"
/>
