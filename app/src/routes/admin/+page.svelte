<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<h1>grimoire admin</h1>

<form method="post" action="/admin/logout">
	<button>Log out</button>
</form>

<h2>Projects</h2>
{#if data.projects.length === 0}
	<p>No projects yet.</p>
{:else}
	<ul>
		{#each data.projects as project (project.id)}
			<li>
				<a href={resolve('/admin/projects/[id]', { id: String(project.id) })}>{project.slug}</a>
				{#if project.description}– {project.description}{/if}
			</li>
		{/each}
	</ul>
{/if}
<p><a href={resolve('/admin/projects/[id]', { id: 'new' })}>New project</a></p>
