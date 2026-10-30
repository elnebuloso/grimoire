<script lang="ts">
	import { resolve } from '$app/paths';
	import ConfirmForm from '#lib/components/ConfirmForm.svelte';
	import DateTime from '#lib/components/DateTime.svelte';
	import FormError from '#lib/components/FormError.svelte';
	import SlugChangeForm from '#lib/components/SlugChangeForm.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { MAX_NAME_LENGTH } from '#lib/slug.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const values = $derived(form?.values ?? data.project);
</script>

<p><a href={resolve('/manage')}>{m.all_projects_link()}</a></p>
<h1>{m.project_title({ name: data.project.name })}</h1>

<form method="post" action="?/save">
	<FormError message={form?.error} />
	<TextField
		label={m.field_name()}
		name="name"
		required
		maxlength={MAX_NAME_LENGTH}
		value={values.name}
	/>
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
					href={resolve('/manage/projects/[id]/sources/[sourceId]', {
						id: String(data.project.id),
						sourceId: String(source.id)
					})}>{source.name}</a
				>
				<code>{source.slug}</code>
				– {m.project_source_summary({
					gitUrl: source.gitUrl,
					branch: source.branch,
					path: source.path || m.whole_repository()
				})}{source.paused ? `, ${m.paused()}` : ''}
				{#if source.docsUrl}
					– <a href={source.docsUrl} rel="external">{m.source_docs_link()}</a>
				{/if}
				–
				{#if source.health.lastSyncedAt}
					{m.source_last_sync()}:
					<DateTime value={source.health.lastSyncedAt} timeZone={data.timeZone} />
				{:else}
					{m.admin_never_synced()}
				{/if}
				{#if source.health.error}– {m.admin_sync_error({ error: source.health.error })}{/if}
				{#if source.health.warnings.length > 0}
					– {source.health.warnings.length === 1
						? m.project_source_warning()
						: m.project_source_warnings({ count: source.health.warnings.length })}
				{/if}
			</li>
		{/each}
	</ul>
{/if}
<p>
	<a
		href={resolve('/manage/projects/[id]/sources/[sourceId]', {
			id: String(data.project.id),
			sourceId: 'new'
		})}>{m.project_new_source()}</a
	>
</p>

<h2>{m.slug_change_heading()}</h2>
<SlugChangeForm
	current={data.project.slug}
	effects={m.slug_change_project_effects({ slug: data.project.slug })}
	value={form?.slugValues?.slug}
	error={form?.slugError}
	changed={form?.slugChanged}
/>

<h2>{m.delete()}</h2>
<ConfirmForm
	action="?/delete"
	question={m.project_delete_question({ name: data.project.name })}
	label={m.project_delete()}
/>
