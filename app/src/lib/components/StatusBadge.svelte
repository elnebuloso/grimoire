<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import type { RunOutcome, SourceState } from '#lib/source-state.js';

	/** The word for the state of a source or the outcome of a sync, the only place that names them. */
	let { state }: { state: SourceState | RunOutcome } = $props();

	const WORDS: Record<SourceState | RunOutcome, () => string> = {
		syncing: m.source_syncing,
		error: m.source_state_error,
		paused: m.state_paused,
		never: m.not_synced,
		synced: m.source_history_synced,
		unchanged: m.source_history_unchanged,
		failed: m.source_history_failed
	};
</script>

<span class="badge {state}">{WORDS[state]()}</span>

<style>
	.badge {
		display: inline-block;
		padding: 0 var(--s2);
		color: var(--ink-2);
		background: var(--well);
		border-radius: 999px;
		font-size: 13px;
		font-weight: 500;
		white-space: nowrap;
	}
	.synced {
		color: var(--ok);
	}
	.error,
	.failed {
		color: var(--err);
		font-weight: 600;
	}
	.syncing {
		color: var(--accent);
	}
</style>
