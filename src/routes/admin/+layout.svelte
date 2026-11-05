<script lang="ts">
	import { loadAdminSecret, saveAdminSecret } from '../../lib/client/admin-session';

	let { children } = $props();
	let secret = $state(loadAdminSecret());
	let input = $state('');
	let menuOpen = $state(false);

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
			<a href="/admin" class="logo"><strong>sotto</strong></a>
			<button
				type="button"
				class="menu-toggle"
				aria-label={menuOpen ? 'Menü schließen' : 'Menü öffnen'}
				onclick={() => (menuOpen = !menuOpen)}
			>
				{#if menuOpen}&#10005;{:else}&#9776;{/if}
			</button>
			<nav class:open={menuOpen}>
				<a href="/admin/surveys" onclick={() => (menuOpen = false)}>Umfragen</a>
				<a href="/admin/groups" onclick={() => (menuOpen = false)}>Gruppen</a>
				<a href="/admin/surveys/new" onclick={() => (menuOpen = false)}>+ Neue Umfrage</a>
				<button type="button" class="sign-out" onclick={signOut}>Abmelden</button>
			</nav>
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
		flex-wrap: wrap;
		gap: var(--space-2);
		align-items: center;
		margin-bottom: var(--space-3);
		padding: var(--space-2);
	}
	.logo {
		text-decoration: none;
		font-size: var(--font-size-h5);
		letter-spacing: -0.04em;
	}
	.menu-toggle {
		display: none;
		margin-left: auto;
		background: none;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		width: 40px;
		height: 40px;
		font-size: 1.2rem;
		cursor: pointer;
		align-items: center;
		justify-content: center;
	}
	nav {
		display: flex;
		gap: var(--space-2);
		align-items: center;
		margin-left: auto;
	}
	nav a {
		font-size: var(--font-size-small);
		font-weight: 600;
	}
	.sign-out {
		font-size: var(--font-size-small);
		font-weight: 600;
		background: none;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		padding: 6px 12px;
		cursor: pointer;
		color: var(--color-muted);
		transition: border-color 0.15s, color 0.15s;
	}
	.sign-out:hover {
		border-color: var(--color-primary);
		color: var(--color-primary);
	}
	form {
		display: grid;
		gap: var(--space-2);
		max-width: 24rem;
		padding: var(--space-3) var(--space-2);
	}
	h1 {
		font-size: var(--font-size-h4);
	}
	form input {
		min-height: 48px;
		font-size: var(--font-size-body);
		padding: 0 var(--space-2);
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		margin-top: var(--space-1);
		display: block;
		width: 100%;
		box-sizing: border-box;
	}
	form input:focus {
		outline: 2px solid var(--color-primary);
		outline-offset: 1px;
	}
	form button[type='submit'] {
		min-height: 48px;
		font-size: var(--font-size-body);
		font-weight: 700;
		border-radius: 8px;
		border: none;
		background: var(--color-primary);
		color: var(--color-bg);
		cursor: pointer;
	}
	@media (max-width: 640px) {
		.menu-toggle {
			display: flex;
		}
		nav {
			display: none;
			flex-direction: column;
			width: 100%;
			gap: 0;
			margin-left: 0;
			border: 1px solid #e0e0e0;
			border-radius: 8px;
			overflow: hidden;
		}
		nav.open {
			display: flex;
		}
		nav a,
		nav .sign-out {
			display: block;
			width: 100%;
			padding: 12px var(--space-2);
			font-size: var(--font-size-body);
			text-align: left;
			border: none;
			border-radius: 0;
			border-bottom: 1px solid #e0e0e0;
			box-sizing: border-box;
		}
		nav .sign-out {
			border-bottom: none;
			color: var(--color-accent);
		}
	}
</style>
