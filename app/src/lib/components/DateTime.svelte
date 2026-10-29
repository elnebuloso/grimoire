<script lang="ts">
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { formatDateTime } from '#lib/time-zone.js';

	let { value, timeZone }: { value: string; timeZone: string } = $props();
</script>

<time datetime={value}>{formatDateTime(value, getLocale(), timeZone)}</time>
