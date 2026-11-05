<script lang="ts">
	import DynamicChart from './charts/DynamicChart.svelte';
	import type { AggregatedDimension } from '../server/aggregator';
	import type { Question, ChartType } from '../types/survey';

	let { surveyId, questions }: { surveyId: string; questions: Question[] } = $props();

	const CHART_OPTIONS: { value: ChartType; label: string }[] = [
		{ value: 'scatter', label: 'Streudiagramm' },
		{ value: 'bar', label: 'Balkendiagramm' },
		{ value: 'sankey', label: 'Sankey' },
		{ value: 'bubble', label: 'Blasendiagramm' }
	];

	let xAxis = $state(questions[0]?.id ?? '');
	let yAxis = $state(questions[1]?.id ?? '');
	let chartType = $state<ChartType>('scatter');
	let dimension = $state<AggregatedDimension | null>(null);
	let loading = $state(false);
	let errorMessage = $state('');

	function questionLabel(id: string): string {
		const question = questions.find((q) => q.id === id);
		if (!question) return id;
		let label = question.text;
		if (label.length > 60) label = label.slice(0, 57) + '…';
		return label;
	}

	async function fetchDimension() {
		if (!surveyId || !xAxis || !yAxis || xAxis === yAxis) {
			dimension = null;
			return;
		}
		loading = true;
		errorMessage = '';
		try {
			const response = await fetch(
				`/api/surveys/${surveyId}/explore?x=${encodeURIComponent(xAxis)}&y=${encodeURIComponent(yAxis)}&chart=${chartType}`
			);
			if (!response.ok) {
				errorMessage = 'Daten konnten nicht geladen werden.';
				dimension = null;
				return;
			}
			const result = await response.json();
			dimension = result.dimension;
		} catch {
			errorMessage = 'Verbindungsfehler.';
			dimension = null;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		xAxis;
		yAxis;
		chartType;
		fetchDimension();
	});
</script>

<section class="explorer">
	<h2>Daten erkunden</h2>
	<div class="controls">
		<label class="control">
			<span class="control-label">X-Achse</span>
			<select bind:value={xAxis}>
				{#each questions as q (q.id)}
					<option value={q.id}>{questionLabel(q.id)}</option>
				{/each}
			</select>
		</label>
		<label class="control">
			<span class="control-label">Y-Achse</span>
			<select bind:value={yAxis}>
				{#each questions as q (q.id)}
					<option value={q.id}>{questionLabel(q.id)}</option>
				{/each}
			</select>
		</label>
		<label class="control">
			<span class="control-label">Darstellung</span>
			<select bind:value={chartType}>
				{#each CHART_OPTIONS as option (option.value)}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</label>
	</div>

	{#if xAxis === yAxis}
		<p class="hint">Wähle zwei verschiedene Parameter.</p>
	{:else if loading}
		<p class="hint">Lade …</p>
	{:else if errorMessage}
		<p class="hint error">{errorMessage}</p>
	{:else if dimension && dimension.points.length > 0}
		<DynamicChart data={dimension} {chartType} />
		{#if dimension.correlation !== null}
			<p class="correlation">
				Korrelation: {dimension.correlation > 0 ? '+' : ''}{dimension.correlation.toFixed(2)}
				{#if Math.abs(dimension.correlation) >= 0.5}
					— starker Zusammenhang
				{:else if Math.abs(dimension.correlation) >= 0.2}
					— schwacher Zusammenhang
				{:else}
					— kein Zusammenhang
				{/if}
			</p>
		{/if}
		{#if dimension.suppressedCells > 0}
			<p class="suppressed">{dimension.suppressedCells} Kombination{dimension.suppressedCells > 1 ? 'en' : ''} aus Datenschutzgründen ausgeblendet.</p>
		{/if}
	{:else if dimension}
		<p class="hint">Zu wenige Antworten für eine anonyme Darstellung dieser Kombination.</p>
	{/if}
</section>

<style>
	.explorer {
		margin: var(--space-4) 0;
		padding: var(--space-3) 0;
		border-top: 1px solid #e0e0e0;
	}
	h2 {
		font-size: var(--font-size-h4);
		margin: 0 0 var(--space-2);
	}
	.controls {
		display: flex;
		gap: var(--space-2);
		flex-wrap: wrap;
		margin-bottom: var(--space-2);
	}
	.control {
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex: 1;
		min-width: 200px;
	}
	.control-label {
		font-size: var(--font-size-small);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-muted);
	}
	select {
		padding: 10px 12px;
		font-size: 15px;
		font-family: inherit;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		background: #fff;
		color: #000;
		appearance: auto;
		cursor: pointer;
	}
	select:focus {
		outline: 2px solid var(--color-accent);
		outline-offset: 1px;
	}
	.hint {
		font-size: var(--font-size-small);
		color: var(--color-muted);
		padding: var(--space-3) 0;
		text-align: center;
	}
	.error {
		color: var(--color-accent);
	}
	.correlation {
		font-size: var(--font-size-small);
		font-weight: 600;
		margin-top: 8px;
	}
	.suppressed {
		font-size: var(--font-size-small);
		color: var(--color-muted);
		margin-top: 4px;
	}
	@media (max-width: 600px) {
		.controls {
			flex-direction: column;
		}
		.control {
			min-width: 100%;
		}
	}
</style>
