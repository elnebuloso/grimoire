<script lang="ts">
	import QueryForm from '#lib/components/QueryForm.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<h1>{m.query_title()}</h1>
<p>{m.query_intro()}</p>

<QueryForm {...data} />
