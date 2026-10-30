<script lang="ts">
	import ChoiceField from '#lib/components/ChoiceField.svelte';
	import FormError from '#lib/components/FormError.svelte';
	import TextField from '#lib/components/TextField.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<h1>{m.query_title()}</h1>
<p>{m.query_intro()}</p>

<form method="get">
	<FormError message={data.error} />
	<TextField label={m.query_question()} name="q" type="search" value={data.values.question} />
	<fieldset>
		<legend>{m.query_sources()}</legend>
		{#each data.sources as source (source)}
			<ChoiceField
				name="source"
				value={source}
				checked={data.values.sources.includes(source)}
				label={source}
			/>
		{/each}
	</fieldset>
	<TextField
		label={m.query_tokens()}
		name="tokens"
		type="number"
		min="1"
		value={data.values.tokens}
	/>
	<button>{m.query_submit()}</button>
</form>

{#if data.answer}
	<h2>{m.query_answer()}</h2>
	<pre>{data.answer}</pre>
{/if}
