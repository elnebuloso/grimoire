<script lang="ts">
	import PageHead from '#lib/components/PageHead.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<meta http-equiv="refresh" content="0;url={data.next}" />
</svelte:head>

<PageHead title={m.oidc_finish_title()} />

<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- a path on this site the server checked -->
<p><a href={data.next}>{m.oidc_finish_continue()}</a></p>
