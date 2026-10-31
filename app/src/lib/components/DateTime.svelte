<script lang="ts">
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { formatDateTime, formatShortDateTime } from '#lib/time-zone.js';

	let {
		value,
		timeZone,
		short = false
	}: {
		value: string;
		timeZone: string;
		/** Date and time in the short form of the locale, without the zone, for a column whose head names it. */
		short?: boolean;
	} = $props();
</script>

<time datetime={value}
	>{(short ? formatShortDateTime : formatDateTime)(value, getLocale(), timeZone)}</time
>
