<script lang="ts">
	import { resolve } from '$app/paths';
	import ChoiceField from '#lib/components/ChoiceField.svelte';
	import ConfirmForm from '#lib/components/ConfirmForm.svelte';
	import FormError from '#lib/components/FormError.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const values = $derived(
		form?.values ?? { name: '', allProjects: true, projects: [] as string[] }
	);
</script>

<p><a href={resolve('/admin')}>All projects</a></p>
<h1>API keys</h1>

{#if form?.created}
	<p role="status">
		Key for {form.created.name} created. Copy it now: it is not shown again.
		<output>{form.created.key}</output>
	</p>
{/if}

{#if data.keys.length === 0}
	<p>No API keys yet.</p>
{:else}
	<ul>
		{#each data.keys as key (key.id)}
			<li>
				{key.name} – {key.projects === 'all'
					? 'all projects'
					: key.projects.join(', ') || 'no projects'}, created {key.createdAt}
				<ConfirmForm
					action="?/revoke"
					question="Revoke the key {key.name}? Agents using it lose access at once."
					label="Revoke"
					buttonLabel="Revoke {key.name}"
				>
					<input type="hidden" name="id" value={key.id} />
				</ConfirmForm>
			</li>
		{/each}
	</ul>
{/if}

<h2>New key</h2>
<form method="post" action="?/create">
	<FormError message={form?.error} />
	<TextField label="Name" name="name" required value={values.name} />
	<fieldset>
		<legend>Projects the key may read</legend>
		<ChoiceField
			type="radio"
			name="scope"
			value="all"
			checked={values.allProjects}
			label="All projects, including future ones"
		/>
		<ChoiceField
			type="radio"
			name="scope"
			value="selected"
			checked={!values.allProjects}
			label="Only these:"
		/>
		{#each data.projects as project (project)}
			<ChoiceField
				name="projects"
				value={project}
				checked={values.projects.includes(project)}
				label={project}
			/>
		{/each}
	</fieldset>
	<button>Create key</button>
</form>
