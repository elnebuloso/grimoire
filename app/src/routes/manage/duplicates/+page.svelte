<script lang="ts">
	import { resolve } from '$app/paths';
	import PageHead from '#lib/components/PageHead.svelte';
	import TableScroll from '#lib/components/TableScroll.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<PageHead title={m.duplicates_title()}><p>{m.duplicates_lead()}</p></PageHead>

<section class="sheet flush">
	{#if data.pairs.length === 0}
		<p class="muted">{m.duplicates_none()}</p>
	{:else}
		<TableScroll label={m.duplicates_title()}>
			<table>
				<thead>
					<tr>
						<th scope="col">{m.duplicates_kind()}</th>
						<th scope="col">{m.sources()}</th>
					</tr>
				</thead>
				<tbody>
					{#each data.pairs as pair (`${pair.first.id}-${pair.second.id}`)}
						<tr>
							<td>
								{pair.kind === 'duplicate'
									? m.duplicates_kind_duplicate()
									: m.duplicates_kind_overlap()}
							</td>
							<td>
								<a href={resolve('/manage/sources/[id]/[[tab=tab]]', { id: String(pair.first.id) })}
									><code>{pair.first.slug}</code></a
								>,
								<a
									href={resolve('/manage/sources/[id]/[[tab=tab]]', { id: String(pair.second.id) })}
									><code>{pair.second.slug}</code></a
								>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</TableScroll>
	{/if}
</section>
