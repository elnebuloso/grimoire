<script lang="ts">
	import { resolve } from '$app/paths';
	import ChoiceField from '#lib/components/ChoiceField.svelte';
	import DescriptionList from '#lib/components/DescriptionList.svelte';
	import FormError from '#lib/components/FormError.svelte';
	import TextAreaField from '#lib/components/TextAreaField.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import { m } from '#lib/paraglide/messages.js';
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
	const STEPS = {
		project: m.project(),
		source: m.wizard_step_source(),
		summary: m.wizard_step_summary()
	};
</script>

{#snippet projectFields(visible: boolean)}
	{#if visible}
		<TextField label={m.field_slug()} name="projectSlug" required value={values.project.slug} />
		<TextField
			label={m.field_description()}
			name="description"
			value={values.project.description}
		/>
	{:else}
		<input type="hidden" name="projectSlug" value={values.project.slug} />
		<input type="hidden" name="description" value={values.project.description} />
	{/if}
{/snippet}

{#snippet sourceFields(visible: boolean)}
	{#if visible}
		<TextField label={m.field_slug()} name="sourceSlug" required value={values.source.slug} />
		<TextField
			label={m.field_git_url()}
			name="gitUrl"
			type="url"
			required
			value={values.source.gitUrl}
		/>
		<TextField label={m.field_branch()} name="branch" required value={values.source.branch} />
		<TextField label={m.field_path()} name="path" value={values.source.path} />
		<TextAreaField
			label={m.field_exclusions()}
			name="exclusions"
			value={values.source.exclusions}
		/>
		<TextField
			label={m.field_schedule({ schedule: data.globalSchedule })}
			name="schedule"
			value={values.source.schedule}
		/>
		<ChoiceField name="paused" checked={values.source.paused} label={m.field_paused()} />
		<TextField label={m.field_username()} name="username" value={values.source.username} />
		<TextField
			label={values.encryptedToken ? m.field_token_entered() : m.field_token_none_entered()}
			name="token"
			type="password"
			autocomplete="off"
		/>
		{#if values.encryptedToken}
			<ChoiceField name="removeToken" label={m.field_remove_entered_token()} />
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

<p><a href={resolve('/admin')}>{m.all_projects_link()}</a></p>
<h1>{m.admin_new_project()}</h1>
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
		<button formaction="?/source">{m.next()}</button>
	{:else if step === 'source'}
		<button formaction="?/project" formnovalidate>{m.back()}</button>
		<button formaction="?/summary">{m.next()}</button>
	{:else}
		<DescriptionList
			items={[
				[
					m.project(),
					values.project.slug + (values.project.description && ` – ${values.project.description}`)
				],
				[m.source(), values.source.slug],
				[m.wizard_git_url(), values.source.gitUrl],
				[m.field_branch(), values.source.branch],
				[m.wizard_path(), values.source.path || m.whole_repository()],
				[m.wizard_exclusions(), values.source.exclusions.trim() || m.none()],
				[
					m.wizard_schedule(),
					values.source.schedule || m.schedule_global({ schedule: data.globalSchedule })
				],
				[m.source_polling(), values.source.paused ? m.paused() : m.active()],
				[m.field_username(), values.source.username || m.none()],
				[m.wizard_access_token(), values.encryptedToken ? m.entered() : m.none()]
			]}
		/>
		<p>{m.wizard_nothing_saved()}</p>
		<button formaction="?/source">{m.back()}</button>
		<button formaction="?/create">{m.wizard_create()}</button>
	{/if}
</form>
