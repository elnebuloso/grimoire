<script lang="ts">
	import PageList from '#lib/components/PageList.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageData } from './$types';

	/** The pages of a saved source, or the preview of one of them as agents read it. */
	let {
		data,
		pagesHref
	}: {
		data: PageData & {
			source: NonNullable<PageData['source']>;
			status: NonNullable<PageData['status']>;
		};
		pagesHref: string;
	} = $props();
</script>

<section class="sheet" aria-labelledby="pages">
	{#if data.preview}
		<a class="back" href={pagesHref}>{m.source_all_pages()}</a>
		<h2 id="pages">{m.source_preview_title({ file: data.preview.file })}</h2>
		{#if data.preview.snippets?.length === 0}
			<p class="notice warn">{m.source_preview_no_snippets({ name: data.instanceTitle })}</p>
		{:else if data.preview.snippets}
			<p>
				{m.source_preview_intro_before()} <code>read</code>
				{m.source_preview_intro_after()}
			</p>
			<ol class="snippets">
				{#each data.preview.snippets as snippet, index (index)}
					<li>
						<h3>{snippet.titlePath.join(' › ')}</h3>
						<p class="hint">
							<code>{snippet.id}</code> – {m.source_preview_snippet_tokens({
								tokens: snippet.tokens
							})}
						</p>
						<pre>{snippet.markdown}</pre>
					</li>
				{/each}
			</ol>
		{:else}
			<p class="notice warn">{m.source_preview_missing({ file: data.preview.file })}</p>
		{/if}
	{:else}
		<h2 id="pages">{m.pages()}</h2>
		{#if data.status.pages.length === 0}
			<p class="muted">{m.source_pages_none()}</p>
		{:else}
			<PageList pages={data.status.pages} sourceId={data.source.id} />
		{/if}
	{/if}
</section>

<style>
	.sheet {
		display: grid;
		gap: var(--s4);
	}
	.back {
		justify-self: start;
		font-size: 14px;
	}
	.hint {
		color: var(--ink-2);
		font-size: 13px;
	}
	.snippets {
		display: grid;
		gap: var(--s5);
		list-style: none;
		counter-reset: snippet;
	}
	.snippets li {
		display: grid;
		gap: var(--s2);
		counter-increment: snippet;
	}
	.snippets h3::before {
		content: counter(snippet) '  ';
		color: var(--ink-2);
		font-family: var(--mono);
		font-weight: 400;
	}
</style>
