<script lang="ts">
	import { resolve } from '$app/paths';
	import ChoiceField from '#lib/components/ChoiceField.svelte';
	import ConfirmForm from '#lib/components/ConfirmForm.svelte';
	import DateTime from '#lib/components/DateTime.svelte';
	import FormError from '#lib/components/FormError.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const values = $derived(
		form?.values ?? { name: '', allProjects: true, projects: [] as string[] }
	);
</script>

<p><a href={resolve('/manage')}>{m.all_projects_link()}</a></p>
<h1>{m.api_keys()}</h1>

{#if form?.created}
	<p role="status">
		{m.apikeys_created({ name: form.created.name })}
		<output>{form.created.key}</output>
	</p>
{/if}

{#if data.keys.length === 0}
	<p>{m.apikeys_none()}</p>
{:else}
	<ul>
		{#each data.keys as key (key.id)}
			<li>
				{key.name} – {key.projects === 'all'
					? m.apikeys_all_projects()
					: key.projects.join(', ') || m.apikeys_no_projects()}, {m.apikeys_created_at()}
				<DateTime value={key.createdAt} timeZone={data.timeZone} />
				<ConfirmForm
					action="?/revoke"
					question={m.apikeys_revoke_question({ name: key.name })}
					label={m.apikeys_revoke()}
					buttonLabel={m.apikeys_revoke_named({ name: key.name })}
				>
					<input type="hidden" name="id" value={key.id} />
				</ConfirmForm>
			</li>
		{/each}
	</ul>
{/if}

<h2>{m.apikeys_new()}</h2>
<form method="post" action="?/create">
	<FormError message={form?.error} />
	<TextField label={m.field_name()} name="name" required value={values.name} />
	<fieldset>
		<legend>{m.apikeys_scope()}</legend>
		<ChoiceField
			type="radio"
			name="scope"
			value="all"
			checked={values.allProjects}
			label={m.apikeys_scope_all()}
		/>
		<ChoiceField
			type="radio"
			name="scope"
			value="selected"
			checked={!values.allProjects}
			label={m.apikeys_scope_selected()}
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
	<button>{m.apikeys_submit()}</button>
</form>
