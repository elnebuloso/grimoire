<script lang="ts">
	import { resolve } from '$app/paths';
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
		<p><label>Slug <input name="projectSlug" required value={values.project.slug} /></label></p>
		<p>
			<label>
				Short description <input name="description" value={values.project.description} />
			</label>
		</p>
	{:else}
		<input type="hidden" name="projectSlug" value={values.project.slug} />
		<input type="hidden" name="description" value={values.project.description} />
	{/if}
{/snippet}

{#snippet sourceFields(visible: boolean)}
	{#if visible}
		<p><label>Slug <input name="sourceSlug" required value={values.source.slug} /></label></p>
		<p>
			<label>
				Git URL (HTTPS)
				<input name="gitUrl" type="url" required value={values.source.gitUrl} />
			</label>
		</p>
		<p><label>Branch <input name="branch" required value={values.source.branch} /></label></p>
		<p>
			<label>
				Path in the repository (empty for the whole repository)
				<input name="path" value={values.source.path} />
			</label>
		</p>
		<p>
			<label>
				Exclusions: glob patterns relative to the repository root, one per line
				<textarea name="exclusions">{values.source.exclusions}</textarea>
			</label>
		</p>
		<p>
			<label>
				Schedule: cron expression with five fields, empty for the global one ({data.globalSchedule})
				<input name="schedule" value={values.source.schedule} />
			</label>
		</p>
		<p>
			<label>
				<input name="paused" type="checkbox" checked={values.source.paused} /> Paused: polling skips this
				source, only "Sync now" syncs it
			</label>
		</p>
		<p><label>Username <input name="username" value={values.source.username} /></label></p>
		<p>
			<label>
				Access token ({values.encryptedToken ? 'entered; leave empty to keep it' : 'none entered'})
				<input name="token" type="password" autocomplete="off" />
			</label>
		</p>
		{#if values.encryptedToken}
			<p><label><input name="removeToken" type="checkbox" /> Remove the entered token</label></p>
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
	{#if form?.error}<p role="alert">{form.error}</p>{/if}
	{@render projectFields(step === 'project')}
	{@render sourceFields(step === 'source')}

	{#if step === 'project'}
		<button formaction="?/source">Next</button>
	{:else if step === 'source'}
		<button formaction="?/project" formnovalidate>Back</button>
		<button formaction="?/summary">Next</button>
	{:else}
		<dl>
			<dt>Project</dt>
			<dd>
				{values.project.slug}{values.project.description && ` – ${values.project.description}`}
			</dd>
			<dt>Source</dt>
			<dd>{values.source.slug}</dd>
			<dt>Git URL</dt>
			<dd>{values.source.gitUrl}</dd>
			<dt>Branch</dt>
			<dd>{values.source.branch}</dd>
			<dt>Path</dt>
			<dd>{values.source.path || '(whole repository)'}</dd>
			<dt>Exclusions</dt>
			<dd>{values.source.exclusions.trim() || 'none'}</dd>
			<dt>Schedule</dt>
			<dd>{values.source.schedule || `global (${data.globalSchedule})`}</dd>
			<dt>Polling</dt>
			<dd>{values.source.paused ? 'paused' : 'active'}</dd>
			<dt>Username</dt>
			<dd>{values.source.username || 'none'}</dd>
			<dt>Access token</dt>
			<dd>{values.encryptedToken ? 'entered' : 'none'}</dd>
		</dl>
		<p>Nothing is saved until you create the project.</p>
		<button formaction="?/source">Back</button>
		<button formaction="?/create">Create project</button>
	{/if}
</form>
