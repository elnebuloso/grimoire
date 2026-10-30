<script lang="ts">
	import PageHead from '#lib/components/PageHead.svelte';
	import QueryForm from '#lib/components/QueryForm.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<PageHead title={m.query_title()}><p>{m.query_intro()}</p></PageHead>

<section class="sheet">
	<QueryForm {...data} />
</section>
