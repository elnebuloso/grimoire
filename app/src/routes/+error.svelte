<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';

	// The message of an unexpected error is not shown: it can name internals.
	const title = $derived(
		page.status === 404
			? m.error_not_found()
			: page.status === 403
				? m.error_forbidden()
				: m.error_unexpected()
	);
</script>

<h1>{title}</h1>
<p><a href={resolve('/')}>{m.error_start_page()}</a></p>
