<script lang="ts">
	import ConfirmAction from '#lib/components/ConfirmAction.svelte';
	import DateTime from '#lib/components/DateTime.svelte';
	import PageHead from '#lib/components/PageHead.svelte';
	import RequestsPerDay from '#lib/components/RequestsPerDay.svelte';
	import DataTable from '#lib/components/DataTable.svelte';
	import KeyScope from '#lib/components/KeyScope.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<PageHead title={m.api_keys_all()}><p>{m.apikeys_admin_lead()}</p></PageHead>

<section class="sheet flush" aria-label={m.api_keys_all()}>
	<DataTable
		label={m.api_keys_all()}
		list={data.keys}
		key={(key) => key.id}
		search={m.apikeys_search()}
		columns={[
			{ label: m.field_name(), sort: 'name' },
			{ label: m.apikeys_owner() },
			{ label: m.sources() },
			{ label: m.apikeys_last_used_heading(), sort: 'used' },
			{ label: m.requests_count() },
			{ label: m.apikeys_revoke() }
		]}
	>
		{#snippet row(key)}
			<th scope="row"><code>{key.name}</code></th>
			<td>{key.owner ?? m.apikeys_no_owner()}</td>
			<td>
				<KeyScope
					allSources={key.sources === 'all'}
					slugs={key.sources === 'all' ? [] : key.sources}
				/>
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
				<ConfirmAction
					action="?/revoke"
					title={m.apikeys_revoke_title({ name: key.name })}
					consequence={m.apikeys_revoke_consequence()}
					danger
					label={m.apikeys_revoke()}
					buttonLabel={m.apikeys_revoke_named({ name: key.name })}
					success={m.apikeys_revoked({ name: key.name })}
				>
					<input type="hidden" name="id" value={key.id} />
				</ConfirmAction>
			</td>
		{/snippet}
		{#snippet empty()}<p class="muted">
				{data.filtered ? m.list_no_match() : m.apikeys_none()}
			</p>{/snippet}
	</DataTable>
</section>

<style>
	.action {
		text-align: end;
	}
</style>
