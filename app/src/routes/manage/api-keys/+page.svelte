<script lang="ts">
	import ConfirmAction from '#lib/components/ConfirmAction.svelte';
	import DateTime from '#lib/components/DateTime.svelte';
	import PageHead from '#lib/components/PageHead.svelte';
	import RequestsPerDay from '#lib/components/RequestsPerDay.svelte';
	import DataTable from '#lib/components/DataTable.svelte';
	import KeyScope from '#lib/components/KeyScope.svelte';
	import { resolve } from '$app/paths';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { formatDate } from '#lib/time-zone.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<PageHead title={m.api_keys_all()}><p>{m.apikeys_admin_lead()}</p></PageHead>

{#if data.owner}
	<p class="notice" role="status">
		{m.apikeys_owner_filter({ owner: data.owner })}
		<a href={resolve('/manage/api-keys')}>{m.apikeys_owner_filter_all()}</a>
	</p>
{/if}

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
			{ label: m.apikeys_valid_until_heading(), sort: 'validUntil' },
			{ label: m.apikeys_last_used_heading(), sort: 'used' },
			{ label: m.requests_count() },
			{ label: m.apikeys_revoke() }
		]}
	>
		{#snippet row(key)}
			<th scope="row"><code>{key.name}</code></th>
			<td>
				{#if key.owner}
					<a href="{resolve('/manage/users')}?search={encodeURIComponent(key.owner)}">{key.owner}</a
					>
				{:else}{m.apikeys_no_owner()}{/if}
			</td>
			<td>
				<KeyScope sources={key.sources} />
			</td>
			<td class:expired={key.expired}>
				{#if !key.validUntil}
					{m.apikeys_no_expiry()}
				{:else}
					{formatDate(key.validUntil, getLocale())}
					{#if key.expired}<br />{m.apikeys_expired_short()}{/if}
				{/if}
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
	.expired {
		color: var(--err);
		font-weight: 500;
	}
</style>
