<script lang="ts">
	import { SYNC_ERROR } from '#lib/sync-fix.js';
	import type { SyncErrorKind } from '#lib/server/sync/error-kind.js';

	/**
	 * A stored sync error: what it means in the reader's language, then the original text, which
	 * names paths and Git's own words. An error of unknown kind shows only the original.
	 */
	let { error, kind }: { error: string; kind: SyncErrorKind | null } = $props();
</script>

{#if kind && kind !== 'unknown'}<span class="summary">{SYNC_ERROR[kind]()}</span>
	<code>{error}</code>{:else}<code>{error}</code>{/if}

<style>
	code {
		font-size: 12.5px;
		overflow-wrap: anywhere;
	}
	.summary + code {
		display: block;
		margin-top: var(--s1);
	}
</style>
