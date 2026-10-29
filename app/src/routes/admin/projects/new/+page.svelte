<script lang="ts">
	import { resolve } from '$app/paths';
	import ChoiceField from '#lib/components/ChoiceField.svelte';
	import DescriptionList from '#lib/components/DescriptionList.svelte';
	import FormError from '#lib/components/FormError.svelte';
	import TextAreaField from '#lib/components/TextAreaField.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const values = $derived(
		form?.values ?? {
			project: { slug: '', description: '' },
			source: {
				slug: '',
				gitUrl: '',
				branch: 'main',
				path: 'docs/',
				exclusions: '',
				schedule: '',
				paused: false,
				username: ''
			},
			encryptedToken: ''
		}
	);
	const step = $derived(form?.step ?? 'project');
	const STEPS = { project: 'Project', source: 'First source', summary: 'Summary' };
</script>

{#snippet projectFields(visible: boolean)}
	{#if visible}
		<TextField label="Slug" name="projectSlug" required value={values.project.slug} />
		<TextField label="Short description" name="description" value={values.project.description} />
	{:else}
		<input type="hidden" name="projectSlug" value={values.project.slug} />
		<input type="hidden" name="description" value={values.project.description} />
	{/if}
{/snippet}

{#snippet sourceFields(visible: boolean)}
	{#if visible}
		<TextField label="Slug" name="sourceSlug" required value={values.source.slug} />
		<TextField
			label="Git URL (HTTPS)"
			name="gitUrl"
			type="url"
			required
			value={values.source.gitUrl}
		/>
		<TextField label="Branch" name="branch" required value={values.source.branch} />
		<TextField
			label="Path in the repository (empty for the whole repository)"
			name="path"
			value={values.source.path}
		/>
		<TextAreaField
			label="Exclusions: glob patterns relative to the repository root, one per line"
			name="exclusions"
			value={values.source.exclusions}
		/>
		<TextField
			label="Schedule: cron expression with five fields, empty for the global one ({data.globalSchedule})"
			name="schedule"
			value={values.source.schedule}
		/>
		<ChoiceField
			name="paused"
			checked={values.source.paused}
			label="Paused: polling skips this source, only &quot;Sync now&quot; syncs it"
		/>
		<TextField label="Username" name="username" value={values.source.username} />
		<TextField
			label="Access token ({values.encryptedToken
				? 'entered; leave empty to keep it'
				: 'none entered'})"
			name="token"
			type="password"
			autocomplete="off"
		/>
		{#if values.encryptedToken}
			<ChoiceField name="removeToken" label="Remove the entered token" />
		{/if}
	{:else}
		<input type="hidden" name="sourceSlug" value={values.source.slug} />
		<input type="hidden" name="gitUrl" value={values.source.gitUrl} />
		<input type="hidden" name="branch" value={values.source.branch} />
		<input type="hidden" name="path" value={values.source.path} />
		<input type="hidden" name="exclusions" value={values.source.exclusions} />
		<input type="hidden" name="schedule" value={values.source.schedule} />
		{#if values.source.paused}<input type="hidden" name="paused" value="on" />{/if}
		<input type="hidden" name="username" value={values.source.username} />
	{/if}
	<input type="hidden" name="encryptedToken" value={values.encryptedToken} />
{/snippet}

<p><a href={resolve('/admin')}>All projects</a></p>
<h1>New project</h1>
<ol>
	{#each Object.entries(STEPS) as [key, label] (key)}
		<li aria-current={key === step ? 'step' : undefined}>{label}</li>
	{/each}
</ol>
<h2>{STEPS[step]}</h2>

<form method="post">
	<FormError message={form?.error} />
	{@render projectFields(step === 'project')}
	{@render sourceFields(step === 'source')}

	{#if step === 'project'}
		<button formaction="?/source">Next</button>
	{:else if step === 'source'}
		<button formaction="?/project" formnovalidate>Back</button>
		<button formaction="?/summary">Next</button>
	{:else}
		<DescriptionList
			items={[
				[
					'Project',
					values.project.slug + (values.project.description && ` – ${values.project.description}`)
				],
				['Source', values.source.slug],
				['Git URL', values.source.gitUrl],
				['Branch', values.source.branch],
				['Path', values.source.path || '(whole repository)'],
				['Exclusions', values.source.exclusions.trim() || 'none'],
				['Schedule', values.source.schedule || `global (${data.globalSchedule})`],
				['Polling', values.source.paused ? 'paused' : 'active'],
				['Username', values.source.username || 'none'],
				['Access token', values.encryptedToken ? 'entered' : 'none']
			]}
		/>
		<p>Nothing is saved until you create the project.</p>
		<button formaction="?/source">Back</button>
		<button formaction="?/create">Create project</button>
	{/if}
</form>
