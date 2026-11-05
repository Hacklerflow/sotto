<script lang="ts">
	import TrustBadge from '../../../../lib/components/TrustBadge.svelte';

	type TrustData = {
		invited: number;
		responded: number;
		thresholdMet: boolean;
		requiredCount: number;
		publicKey: string;
	};
	let { data }: { data: TrustData } = $props();
	let copied = $state(false);

	async function copyKey() {
		await navigator.clipboard.writeText(data.publicKey);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<svelte:head><title>Vertrauen in diese Umfrage</title></svelte:head>

<main>
	<h1>Vertrauen in diese Umfrage</h1>
	<p class="lead">Transparenz über den Anonymisierungsprozess dieser Umfrage.</p>

	<div class="stats">
		<div class="stat-card">
			<span class="stat-value">{data.invited}</span>
			<span class="stat-label">Eingeladen</span>
		</div>
		<div class="stat-card">
			<span class="stat-value">{data.responded}</span>
			<span class="stat-label">Geantwortet</span>
		</div>
		<div class="stat-card" class:met={data.thresholdMet}>
			<span class="stat-value">{data.thresholdMet ? '✓' : data.requiredCount}</span>
			<span class="stat-label">{data.thresholdMet ? 'Schwelle erreicht' : `von ${data.requiredCount} nötig`}</span>
		</div>
	</div>

	<section class="key-section">
		<h2>Öffentlicher Schlüssel</h2>
		<p class="key-hint">Damit lässt sich die Signaturkette dieser Umfrage unabhängig prüfen.</p>
		<textarea readonly rows="6" aria-label="Öffentlicher Schlüssel (Base64, SPKI)">{data.publicKey}</textarea>
		<button type="button" class="copy-btn" onclick={copyKey}>
			{copied ? '✓ Kopiert' : 'Schlüssel kopieren'}
		</button>
	</section>

	<footer class="trust"><TrustBadge /></footer>
</main>

<style>
	main {
		max-width: 48rem;
		margin: 0 auto;
		padding: var(--space-3) var(--space-2);
	}
	h1 {
		font-size: var(--font-size-h2);
		margin: 0 0 var(--space-1);
	}
	h2 {
		font-size: var(--font-size-h4);
		margin: 0 0 var(--space-1);
	}
	.lead {
		color: var(--color-muted);
		line-height: 1.6;
		margin: 0 0 var(--space-4);
	}
	.stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-2);
		margin-bottom: var(--space-4);
	}
	.stat-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		text-align: center;
	}
	.stat-card.met {
		border-color: var(--color-primary);
	}
	.stat-value {
		font-size: var(--font-size-h2);
		font-weight: 900;
		line-height: 1;
	}
	.stat-label {
		font-size: var(--font-size-small);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-muted);
	}
	.key-section {
		padding: var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		margin-bottom: var(--space-3);
	}
	.key-hint {
		color: var(--color-muted);
		font-size: var(--font-size-small);
		margin: 0 0 var(--space-2);
	}
	textarea {
		width: 100%;
		box-sizing: border-box;
		font-family: monospace;
		font-size: 0.85rem;
		padding: var(--space-2);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		background: var(--color-surface);
		resize: none;
		color: var(--color-primary);
	}
	.copy-btn {
		margin-top: var(--space-2);
		min-height: 40px;
		padding: 0 16px;
		font-size: var(--font-size-small);
		font-weight: 700;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		background: transparent;
		color: var(--color-primary);
		cursor: pointer;
		transition: border-color 0.15s;
	}
	.copy-btn:hover {
		border-color: var(--color-primary);
	}
	.trust {
		padding-top: var(--space-2);
	}
	@media (max-width: 480px) {
		.stats {
			grid-template-columns: 1fr;
		}
	}
</style>
