<script lang="ts">
	import { loadAdminSecret, saveAdminSecret } from '../../lib/client/admin-session';

	let { children } = $props();
	let secret = $state(loadAdminSecret());
	let input = $state('');

	function signIn(event: SubmitEvent) {
		event.preventDefault();
		if (input.trim() === '') return;
		saveAdminSecret(input.trim());
		secret = input.trim();
		input = '';
	}

	function signOut() {
		saveAdminSecret('');
		secret = '';
	}
</script>

<div class="admin">
	{#if secret}
		<header>
			<a href="/admin" class="logo"><strong>Sotto</strong></a>
			<nav>
				<a href="/admin/surveys">Umfragen</a>
				<a href="/admin/groups">Gruppen</a>
				<a href="/admin/surveys/new">+ Neue Umfrage</a>
			</nav>
			<button type="button" onclick={signOut}>Abmelden</button>
		</header>
		{@render children()}
	{:else}
		<form onsubmit={signIn}>
			<h1>Admin-Zugang</h1>
			<label>
				Admin-Secret
				<input type="password" bind:value={input} autocomplete="off" />
			</label>
			<button type="submit">Anmelden</button>
		</form>
	{/if}
</div>

<style>
	.admin {
		max-width: 64rem;
		margin: 0 auto;
	}
	header {
		display: flex;
		gap: var(--space-3);
		align-items: center;
		margin-bottom: var(--space-3);
	}
	.logo {
		text-decoration: none;
	}
	nav {
		display: flex;
		gap: var(--space-2);
	}
	nav a {
		font-size: var(--font-size-small);
	}
	header button {
		margin-left: auto;
	}
	form {
		display: grid;
		gap: var(--space-2);
		max-width: 24rem;
	}
	h1 {
		font-size: var(--font-size-h4);
	}
</style>
