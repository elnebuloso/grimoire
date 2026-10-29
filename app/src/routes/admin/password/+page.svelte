<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<p><a href={resolve('/admin')}>All projects</a></p>
<h1>Change the password</h1>

{#if form?.changed}
	<p role="status">Password changed. Every other session was logged out.</p>
{/if}

<form method="post">
	{#if form?.error}<p role="alert">{form.error}</p>{/if}
	<!-- Tells a password manager which saved login the new password belongs to. -->
	<p>
		<label>
			Username
			<input name="username" readonly autocomplete="username" value={data.username} />
		</label>
	</p>
	<p>
		<label>
			Current password
			<input name="current" type="password" required autocomplete="current-password" />
		</label>
	</p>
	<p>
		<label>
			New password (at least 12 characters)
			<input name="password" type="password" required minlength="12" autocomplete="new-password" />
		</label>
	</p>
	<button>Change password</button>
</form>
