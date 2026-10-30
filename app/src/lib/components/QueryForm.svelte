<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import type { QueryFormState } from '#lib/server/query-form.js';
	import ChoiceField from './ChoiceField.svelte';
	import FormError from './FormError.svelte';
	import TextField from './TextField.svelte';

	/** A GET form that asks like the agent operation `query`, and the answer below it. */
	let { sources, values, error, answer }: QueryFormState = $props();
</script>

<form method="get">
	<FormError message={error} />
	<TextField label={m.query_question()} name="q" type="search" value={values.question} />
	{#if sources.length > 0}
		<fieldset>
			<legend>{m.query_sources()}</legend>
			{#each sources as source (source)}
				<ChoiceField
					name="source"
					value={source}
					checked={values.sources.includes(source)}
					label={source}
				/>
			{/each}
		</fieldset>
	{/if}
	<TextField label={m.query_tokens()} name="tokens" type="number" min="1" value={values.tokens} />
	<button>{m.query_submit()}</button>
</form>

{#if answer}
	<h2>{m.query_answer()}</h2>
	<pre>{answer}</pre>
{/if}
