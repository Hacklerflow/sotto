<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';

	let { children } = $props();
	const isAdmin = $derived(page.url.pathname.startsWith('/admin'));
</script>

{#if !isAdmin}
	<header class="site-header">
		<a href="/" class="site-logo">sotto</a>
		<nav aria-label="Hauptnavigation">
			<a href="/trust">Wie es funktioniert</a>
			<a href="/admin">Admin</a>
		</nav>
	</header>
{/if}

<main class="page">
	{@render children()}
</main>

<style>
	.site-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		max-width: var(--content-max-width);
		margin: 0 auto;
		padding: var(--space-2) var(--space-2) 0;
	}
	@media (min-width: 768px) {
		.site-header { padding: var(--space-3) var(--space-3) 0; }
	}
	.site-logo {
		font-weight: 900;
		font-size: var(--font-size-h5);
		letter-spacing: -0.04em;
		text-decoration: none;
		color: var(--color-primary);
	}
	.site-header nav {
		display: flex;
		gap: var(--space-2);
	}
	.site-header nav a {
		font-size: var(--font-size-small);
		font-weight: 600;
	}
</style>
