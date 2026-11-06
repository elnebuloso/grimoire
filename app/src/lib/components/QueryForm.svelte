<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import type { QueryFormState } from '#lib/server/query-form.js';
	import FormError from './FormError.svelte';
	import TextField from './TextField.svelte';

	/** A GET form that asks like the agent operation `query`, and the answer below it. */
	let { values, refusal, answer }: QueryFormState = $props();

	// The two refusals each concern one field; the field points to the message that explains it.
	const marked = (field: string) =>
		refusal?.field === field ? { 'aria-invalid': true, 'aria-describedby': 'query-error' } : {};

	let answerHeading = $state<HTMLHeadingElement>();
	let form = $state<HTMLFormElement>();

	// The answer replaces the page below the form, often past the fold on a phone: focus takes the
	// reader there, and a screen reader announces it. A refusal takes focus to the field it is about.
	$effect(() => {
		if (answer) answerHeading?.focus();
		else if (refusal) form?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
	});
</script>

<div class="query">
	<form method="get" bind:this={form}>
		<FormError message={refusal?.error} id="query-error" />
		<TextField
			label={m.query_question()}
			name="q"
			type="search"
			placeholder={m.query_placeholder()}
			value={values.question}
			{...marked('q')}
		/>
		<TextField
			label={m.query_tokens()}
			name="tokens"
			type="number"
			min="1"
			value={values.tokens}
			{...marked('tokens')}
		/>
		<button class="primary">{m.query_submit()}</button>
	</form>

	{#if answer}
		<div class="answer">
			<h2 tabindex="-1" bind:this={answerHeading}>{m.query_answer()}</h2>
			{#if answer.hits.length === 0}
				<p>
					{answer.skipped > 0
						? m.query_none_fit({ count: answer.skipped })
						: m.query_nothing_found({ question: values.question.trim() })}
				</p>
			{:else}
				{#each answer.hits as hit (hit.id)}
					<section class="hit" aria-label={hit.titlePath.join(' › ')}>
						<h3>{hit.titlePath.join(' › ')}</h3>
						<code class="id">{hit.id}</code>
						<p class="content">{hit.content}</p>
					</section>
				{/each}
				{#if answer.skipped > 0}
					<p class="muted">{m.query_skipped({ count: answer.skipped })}</p>
				{/if}
			{/if}
			{#if answer.hits.length > 0 || answer.skipped > 0}
				<details>
					<summary>{m.query_raw()}</summary>
					<pre>{answer.raw}</pre>
				</details>
			{/if}
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
	.answer {
		gap: var(--s3);
		padding-top: var(--s4);
		border-top: 1px solid var(--line);
	}
	.hit {
		display: grid;
		gap: var(--s1);
		min-width: 0;
	}
	h3 {
		margin: 0;
		font-size: var(--fs-6);
		overflow-wrap: anywhere;
	}
	.id {
		justify-self: start;
		color: var(--ink-2);
		font-size: var(--fs-2);
	}
	/* The snippet exactly as stored: its line breaks carry lists and code. */
	.content {
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
	details pre {
		margin-top: var(--s2);
		overflow-x: auto;
	}
</style>
