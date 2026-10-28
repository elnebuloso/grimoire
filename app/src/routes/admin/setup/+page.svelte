<script lang="ts">
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<h1>Set up grimoire</h1>
<p>Choose the admin account. The setup token is in the server log.</p>

<form method="post">
	{#if form?.error}<p role="alert">{form.error}</p>{/if}
	<p><label>Setup token <input name="token" required autocomplete="off" /></label></p>
	<p><label>Username <input name="username" required value={form?.username ?? ''} /></label></p>
	<p>
		<label>
			Password (at least 12 characters)
			<input name="password" type="password" required minlength="12" autocomplete="new-password" />
		</label>
	</p>
	<button>Create admin account</button>
</form>
