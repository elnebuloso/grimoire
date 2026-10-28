<script lang="ts">
	import { resolve } from '$app/paths';
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
				<form
					method="post"
					action="?/revoke"
					onsubmit={(event) => {
						if (!confirm(`Revoke the key ${key.name}? Agents using it lose access at once.`)) {
							event.preventDefault();
						}
					}}
				>
					<input type="hidden" name="id" value={key.id} />
					<button aria-label="Revoke {key.name}">Revoke</button>
				</form>
			</li>
		{/each}
	</ul>
{/if}

<h2>New key</h2>
<form method="post" action="?/create">
	{#if form?.error}<p role="alert">{form.error}</p>{/if}
	<p><label>Name <input name="name" required value={values.name} /></label></p>
	<fieldset>
		<legend>Projects the key may read</legend>
		<p>
			<label>
				<input type="radio" name="scope" value="all" checked={values.allProjects} />
				All projects, including future ones
			</label>
		</p>
		<p>
			<label>
				<input type="radio" name="scope" value="selected" checked={!values.allProjects} />
				Only these:
			</label>
		</p>
		{#each data.projects as project (project)}
			<p>
				<label>
					<input
						type="checkbox"
						name="projects"
						value={project}
						checked={values.projects.includes(project)}
					/>
					{project}
				</label>
			</p>
		{/each}
	</fieldset>
	<button>Create key</button>
</form>
