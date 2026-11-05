<script lang="ts">
	type InsightType = 'counterintuitive' | 'strong-correlation' | 'weak-correlation';

	let {
		title,
		detail,
		type,
		correlation
	}: { title: string; detail: string; type: InsightType; correlation?: number } = $props();

	const accent = '#ff2d55';
</script>

<article class="card" style="border-color: {accent};">
	{#if type === 'counterintuitive'}
		<span class="badge" style="background: {accent};">Kontraintuitiv</span>
	{/if}
	{#if correlation !== undefined}
		<div class="correlation" style="color: {accent};">{correlation.toFixed(2)}</div>
	{/if}
	<h3>{title}</h3>
	<p>{detail}</p>
</article>

<style>
	.card {
		border-left: 8px solid;
		padding: var(--space-2) var(--space-3);
		margin: var(--space-2) 0;
	}
	.badge {
		display: inline-block;
		color: var(--color-on-primary);
		font-size: 12px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 4px 10px;
		border-radius: 4px;
	}
	.correlation {
		font-size: 56px;
		font-weight: 900;
		line-height: 1;
	}
	h3 {
		font-size: var(--font-size-h5);
		margin: var(--space-1) 0 0;
	}
	p {
		margin: 4px 0 0;
		font-size: var(--font-size-body);
	}
</style>
