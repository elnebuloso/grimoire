<script lang="ts">
	import ConfirmForm from '#lib/components/ConfirmForm.svelte';
	import DateTime from '#lib/components/DateTime.svelte';
	import PageHead from '#lib/components/PageHead.svelte';
	import RequestsPerDay from '#lib/components/RequestsPerDay.svelte';
	import TableScroll from '#lib/components/TableScroll.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<PageHead title={m.api_keys_all()}><p>{m.apikeys_admin_lead()}</p></PageHead>

<section class="sheet flush">
	{#if data.keys.length === 0}
		<p class="muted">{m.apikeys_none()}</p>
	{:else}
		<TableScroll label={m.api_keys_all()}>
			<table>
				<thead>
					<tr>
						<th scope="col">{m.field_name()}</th>
						<th scope="col">{m.apikeys_owner()}</th>
						<th scope="col">{m.sources()}</th>
						<th scope="col">{m.apikeys_last_used_heading()}</th>
						<th scope="col">{m.requests_count()}</th>
						<th scope="col">{m.apikeys_revoke()}</th>
					</tr>
				</thead>
				<tbody>
					{#each data.keys as key (key.id)}
						<tr>
							<th scope="row"><code>{key.name}</code></th>
							<td>{key.owner ?? m.apikeys_no_owner()}</td>
							<td>
								{#if key.sources === 'all'}{m.apikeys_all_sources()}{:else if key.sources.length > 0}<code
										>{key.sources.join(', ')}</code
									>{:else}{m.apikeys_no_sources()}{/if}
							</td>
							<td>
								{#if key.lastUsedAt}<DateTime
										value={key.lastUsedAt}
										timeZone={data.timeZone}
										short
									/>{:else}{m.apikeys_never_used()}{/if}
							</td>
							<td><RequestsPerDay days={key.requests} /></td>
							<td class="action">
								<ConfirmForm
									action="?/revoke"
									question={m.apikeys_revoke_question({ name: key.name })}
									label={m.apikeys_revoke()}
									buttonLabel={m.apikeys_revoke_named({ name: key.name })}
									success={m.apikeys_revoked({ name: key.name })}
								>
									<input type="hidden" name="id" value={key.id} />
								</ConfirmForm>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</TableScroll>
	{/if}
</section>

<style>
	.action {
		text-align: end;
	}
</style>
