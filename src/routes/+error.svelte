<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head><title>{page.status} — Sotto</title></svelte:head>

<div class="error-page">
	<p class="error-code">{page.status}</p>
	<h1>
		{#if page.status === 404}
			Seite nicht gefunden.
		{:else}
			Etwas ist schiefgegangen.
		{/if}
	</h1>
	<p class="error-detail">
		{#if page.status === 404}
			Die angeforderte Seite existiert nicht oder wurde verschoben.
		{:else if page.error?.message}
			{page.error.message}
		{:else}
			Ein unerwarteter Fehler ist aufgetreten.
		{/if}
	</p>
	<a href="/" class="back-link">&larr; Zurück zur Startseite</a>
</div>

<style>
	.error-page {
		min-height: 60dvh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		max-width: 32rem;
	}
	.error-code {
		font-size: clamp(4rem, 20vw, 8rem);
		font-weight: 900;
		letter-spacing: -0.04em;
		line-height: 1;
		margin: 0;
		color: var(--color-border);
	}
	h1 {
		font-size: var(--font-size-h3);
		margin: var(--space-1) 0 var(--space-2);
	}
	.error-detail {
		color: var(--color-muted);
		line-height: 1.6;
		margin: 0 0 var(--space-3);
	}
	.back-link {
		font-weight: 700;
		font-size: var(--font-size-h5);
	}
</style>
