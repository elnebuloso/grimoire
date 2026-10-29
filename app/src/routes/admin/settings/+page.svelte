<script lang="ts">
	import { resolve } from '$app/paths';
	import ChoiceField from '#lib/components/ChoiceField.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<p><a href={resolve('/admin')}>{m.all_projects_link()}</a></p>
<h1>{m.settings_title()}</h1>

{#if form?.saved}
	<p role="status">{m.settings_saved()}</p>
{/if}

<form method="post">
	<ChoiceField
		name="syncsPaused"
		checked={data.settings.syncsPaused}
		label={m.settings_syncs_paused()}
	/>
	<button>{m.settings_submit()}</button>
</form>
