<script lang="ts">
	import TrustBadge from '../../../lib/components/TrustBadge.svelte';

	let {
		data,
		form
	}: {
		data: { valid: boolean; error: string | null; surveyTitle: string | null };
		form: { error: string } | null;
	} = $props();
</script>

<main>
	{#if data.valid}
		<div class="invite-card">
			<p class="logo">sotto</p>
			{#if data.surveyTitle}
				<h1>{data.surveyTitle}</h1>
			{:else}
				<h1>Einladung zur Umfrage</h1>
			{/if}
			<p class="description">
				Du wurdest eingeladen, an einer anonymen Umfrage teilzunehmen.
				Deine Antworten werden kryptografisch von deiner Identität getrennt —
				niemand kann nachvollziehen, wer was geantwortet hat.
			</p>
			{#if form?.error}
				<p class="error">{form.error}</p>
			{/if}
			<form method="POST">
				<button type="submit" class="join-btn">Teilnehmen</button>
			</form>
			<p class="hint">Mit dem Klick auf „Teilnehmen" wird deine Einladung eingelöst. Du kannst nur einmal teilnehmen.</p>
		</div>
	{:else}
		<div class="invite-card error-card">
			<p class="logo">sotto</p>
			<h1>Einladung ungültig</h1>
			<p class="description">{data.error}</p>
			<a href="/" class="back-link">Zur Startseite</a>
		</div>
	{/if}
</main>

<footer class="trust"><TrustBadge /></footer>

<style>
	main {
		min-height: 80dvh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-3) var(--space-2);
	}
	.invite-card {
		max-width: 32rem;
		text-align: center;
	}
	.logo {
		font-size: clamp(2rem, 10vw, 3rem);
		font-weight: 900;
		letter-spacing: -0.04em;
		line-height: 1;
		margin: 0 0 var(--space-2);
	}
	h1 {
		font-size: var(--font-size-h4);
		margin: 0 0 var(--space-2);
	}
	.description {
		color: var(--color-muted);
		line-height: 1.6;
		margin: 0 0 var(--space-3);
	}
	.error {
		color: var(--color-accent);
		font-weight: 600;
		margin: 0 0 var(--space-2);
	}
	.join-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 56px;
		min-width: 200px;
		padding: 0 var(--space-4);
		font-size: var(--font-size-h5);
		font-weight: 700;
		border: none;
		border-radius: 16px;
		background: var(--color-primary);
		color: var(--color-bg);
		cursor: pointer;
		transition: opacity 0.15s;
	}
	.join-btn:hover {
		opacity: 0.85;
	}
	.hint {
		font-size: var(--font-size-small);
		color: var(--color-muted);
		margin: var(--space-2) 0 0;
	}
	.back-link {
		display: inline-block;
		margin-top: var(--space-2);
		font-weight: 600;
	}
	.trust {
		max-width: 32rem;
		margin: 0 auto;
		padding: var(--space-2);
	}
</style>
