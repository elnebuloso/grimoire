<script lang="ts">
	import { resolve } from '$app/paths';
	import ConfirmForm from '#lib/components/ConfirmForm.svelte';
	import FormError from '#lib/components/FormError.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const values = $derived(form?.values ?? data.project);
</script>

<p><a href={resolve('/admin')}>{m.all_projects_link()}</a></p>
<h1>{m.project_title({ slug: data.project.slug })}</h1>

<form method="post" action="?/save">
	<FormError message={form?.error} />
	<TextField label={m.field_slug()} name="slug" required value={values.slug} />
	<TextField label={m.field_description()} name="description" value={values.description} />
	<button>{m.save()}</button>
</form>

<h2>{m.sources()}</h2>
{#if data.sources.length === 0}
	<p>{m.project_no_sources()}</p>
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
				– {m.project_source_summary({
					gitUrl: source.gitUrl,
					branch: source.branch,
					path: source.path || m.whole_repository()
				})}{source.paused ? `, ${m.paused()}` : ''}
			</li>
		{/each}
	</ul>
{/if}
<p>
	<a
		href={resolve('/admin/projects/[id]/sources/[sourceId]', {
			id: String(data.project.id),
			sourceId: 'new'
		})}>{m.project_new_source()}</a
	>
</p>

<h2>{m.delete()}</h2>
<ConfirmForm
	action="?/delete"
	question={m.project_delete_question({ slug: data.project.slug })}
	label={m.project_delete()}
/>
