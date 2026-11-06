<script lang="ts">
	import { resolve } from '$app/paths';
	import PageHead from '#lib/components/PageHead.svelte';
	import DataTable from '#lib/components/DataTable.svelte';
	import SourceLabel from '#lib/components/SourceLabel.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { wholeList } from '#lib/list.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<PageHead title={m.duplicates_title()}><p>{m.duplicates_lead()}</p></PageHead>

<section class="sheet flush" aria-label={m.duplicates_title()}>
	<DataTable
		label={m.duplicates_title()}
		list={wholeList(data.pairs)}
		key={(pair) => `${pair.first.id}-${pair.second.id}`}
		columns={[{ label: m.duplicates_kind() }, { label: m.sources() }]}
	>
		{#snippet row(pair)}
			<td>
				{pair.kind === 'duplicate' ? m.duplicates_kind_duplicate() : m.duplicates_kind_overlap()}
			</td>
			<td>
				<div class="pair">
					{#each [pair.first, pair.second] as source (source.id)}
						<SourceLabel
							name={source.name}
							slug={source.slug}
							href={resolve('/manage/sources/[id]/[[tab=tab]]', { id: String(source.id) })}
						/>
					{/each}
				</div>
			</td>
		{/snippet}
		{#snippet empty()}<p class="muted">{m.duplicates_none()}</p>{/snippet}
	</DataTable>
</section>

<style>
	.pair {
		display: flex;
		flex-wrap: wrap;
		gap: var(--s5);
	}
</style>
