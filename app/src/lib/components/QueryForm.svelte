<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import type { QueryFormState } from '#lib/server/query-form.js';
	import ChoiceField from './ChoiceField.svelte';
	import FormError from './FormError.svelte';
	import TextField from './TextField.svelte';

	/** A GET form that asks like the agent operation `query`, and the answer below it. */
	let { sources, values, error, answer }: QueryFormState = $props();

	// The two refusals each concern one field; the field points to the message that explains it.
	const marked = (message: string) =>
		error === message ? { 'aria-invalid': true, 'aria-describedby': 'query-error' } : {};

	let answerHeading = $state<HTMLHeadingElement>();

	// The answer replaces the page below the form, often past the fold on a phone: focus takes the
	// reader there, and a screen reader announces it.
	$effect(() => {
		if (answer) answerHeading?.focus();
	});
</script>

<div class="query">
	<form method="get">
		<FormError message={error} id="query-error" />
		<TextField
			label={m.query_question()}
			name="q"
			type="search"
			placeholder={m.query_placeholder()}
			value={values.question}
			{...marked(m.query_error_question())}
		/>
		{#if sources.length > 0}
			<fieldset>
				<legend>{m.query_sources()}</legend>
				<div class="checks">
					{#each sources as source (source)}
						<ChoiceField
							name="source"
							value={source}
							checked={values.sources.includes(source)}
							label={source}
							mono
						/>
					{/each}
				</div>
			</fieldset>
		{/if}
		<TextField
			label={m.query_tokens()}
			name="tokens"
			type="number"
			min="1"
			value={values.tokens}
			{...marked(m.query_error_tokens())}
		/>
		<button class="primary">{m.query_submit()}</button>
	</form>

	{#if answer}
		<div class="answer">
			<h2 tabindex="-1" bind:this={answerHeading}>{m.query_answer()}</h2>
			<pre>{answer}</pre>
		</div>
	{/if}
</div>

<style>
	.query,
	.answer {
		display: grid;
		gap: var(--s4);
		min-width: 0;
	}
	.checks {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s2) var(--s5);
	}
	.answer {
		gap: var(--s3);
		padding-top: var(--s4);
		border-top: 1px solid var(--line);
	}
</style>
