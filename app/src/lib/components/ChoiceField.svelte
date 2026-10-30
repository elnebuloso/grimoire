<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	/** A checkbox or radio button with its label after it. */
	let {
		label,
		type = 'checkbox',
		mono = false,
		...input
	}: {
		label: string;
		type?: 'checkbox' | 'radio';
		/** For a machine string as the label, such as a source slug. */
		mono?: boolean;
	} & HTMLInputAttributes = $props();
</script>

<label><input {type} {...input} /> <span class:mono>{label}</span></label>

<style>
	label {
		display: flex;
		align-items: flex-start;
		gap: var(--s3);
		font-weight: 400;
		line-height: 1.45;
		cursor: pointer;
	}
	input {
		flex: none;
		margin-top: 1px;
		cursor: pointer;
	}
	.mono {
		font-family: var(--mono);
		font-size: 13.5px;
	}
	@media (pointer: coarse) {
		label {
			align-items: center;
			min-height: 44px;
		}
		input {
			margin-top: 0;
		}
	}
</style>
