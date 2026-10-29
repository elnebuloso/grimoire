<script lang="ts">
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<h1>Log in to grimoire</h1>

<form method="post">
	{#if form?.error}<p role="alert">{form.error}</p>{/if}
	<p>
		<label
			>Username <input
				name="username"
				required
				autocomplete="username"
				value={form?.username ?? ''}
			/></label
		>
	</p>
	<p>
		<label
			>Password <input
				name="password"
				type="password"
				required
				autocomplete="current-password"
			/></label
		>
	</p>
	<button>Log in</button>
</form>
