<script lang="ts">
	import type { CategoryDistribution } from '../../server/aggregator';

	let { distribution }: { distribution: CategoryDistribution } = $props();

	const maxCount = $derived(Math.max(1, ...distribution.entries.map((entry) => entry.count)));
	const total = $derived(
		distribution.entries.reduce((sum, entry) => sum + entry.count, 0) +
			distribution.suppressedCount
	);
</script>

<div class="distribution">
	{#each distribution.entries as entry (entry.label)}
		<div class="row">
			<span class="label">{entry.label}</span>
			<div class="bar-track">
				<div
					class="bar-fill"
					style="width: {(entry.count / maxCount) * 100}%"
				></div>
			</div>
			<span class="count">{entry.count}</span>
		</div>
	{/each}
	{#if distribution.suppressedCount > 0}
		<p class="suppressed">{distribution.suppressedCount} Antworten aus Datenschutzgründen ausgeblendet.</p>
	{/if}
</div>

<style>
	.distribution {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.row {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.label {
		flex: 0 0 auto;
		min-width: 160px;
		max-width: 260px;
		font-size: var(--font-size-small);
		font-weight: 600;
		text-align: right;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.bar-track {
		flex: 1;
		height: 28px;
		background: #f2f2f2;
		border-radius: 2px;
		overflow: hidden;
	}
	.bar-fill {
		height: 100%;
		background: var(--color-accent);
		border-radius: 2px;
		transition: width 0.4s ease;
	}
	.count {
		flex: 0 0 auto;
		min-width: 28px;
		font-size: var(--font-size-small);
		font-weight: 700;
		text-align: right;
		font-variant-numeric: tabular-nums;
	}
	.suppressed {
		font-size: var(--font-size-small);
		color: var(--color-muted);
		margin: 4px 0 0;
	}
	@media (max-width: 600px) {
		.label {
			min-width: 100px;
			max-width: 140px;
			font-size: 13px;
		}
	}
</style>
