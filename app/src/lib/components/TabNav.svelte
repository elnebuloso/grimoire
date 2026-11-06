<script lang="ts">
	/** Sub pages of one thing as tabs: links, the current one raised. */
	let {
		label,
		tabs
	}: {
		label: string;
		/** `href` resolved by the caller; `current` decided by route, which the server knows too. */
		tabs: { href: string; label: string; current: boolean }[];
	} = $props();
</script>

<nav aria-label={label}>
	{#each tabs as tab (tab.href)}
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- the caller resolves it -->
		<a href={tab.href} aria-current={tab.current ? 'page' : undefined}>{tab.label}</a>
	{/each}
</nav>

<style>
	nav {
		display: flex;
		justify-self: start;
		gap: 2px;
		padding: var(--s1);
		background: var(--well);
		border-radius: var(--r-sheet);
		box-shadow: var(--sink);
	}
	a {
		display: flex;
		align-items: center;
		min-height: 38px;
		padding: 0 var(--s4);
		color: var(--ink-2);
		font-size: 14px;
		text-decoration: none;
		border-radius: 9px;
		transition:
			color var(--t),
			background-color var(--t),
			box-shadow var(--t);
	}
	a:hover {
		color: var(--ink);
	}
	a[aria-current] {
		color: var(--ink);
		background: var(--raised);
		box-shadow: var(--lift-raised);
		font-weight: 500;
	}
</style>
