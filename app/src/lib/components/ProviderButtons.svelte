<script lang="ts">
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';

	/**
	 * One button per identity provider; each posts a form that starts the login there, so it works
	 * without JavaScript. `fields` go along as hidden inputs, such as the page to return to.
	 * Nothing is shown without providers.
	 */
	let {
		providers,
		fields = {}
	}: { providers: { key: string; label: string }[]; fields?: Record<string, string> } = $props();
</script>

{#if providers.length > 0}
	<div class="providers">
		{#each providers as provider (provider.key)}
			<form method="post" action={resolve('/auth/oidc/[key]', { key: provider.key })}>
				{#each Object.entries(fields) as [name, value] (name)}
					<input type="hidden" {name} {value} />
				{/each}
				<button>{m.login_with({ provider: provider.label })}</button>
			</form>
		{/each}
	</div>
{/if}

<style>
	.providers {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s2);
		padding-top: var(--s4);
		border-top: 1px solid var(--line);
	}
</style>
