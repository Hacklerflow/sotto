<script lang="ts">
	import { CHART_TYPES, type ChartType, type Dimension, type Question } from '../types/survey';

	let {
		questions,
		dimensions = $bindable()
	}: { questions: Question[]; dimensions: Dimension[] } = $props();

	const chartLabels: Record<ChartType, string> = {
		sankey: 'Sankey',
		scatter: 'Scatter',
		bubble: 'Bubble',
		bar: 'Bar'
	};

	function addDimension() {
		dimensions.push({ xAxis: '', yAxis: '', chartType: 'scatter' });
	}

	function removeDimension(index: number) {
		dimensions.splice(index, 1);
	}

	function questionText(id: string): string {
		return questions.find((question) => question.id === id)?.text || id;
	}

	function preview(dimension: Dimension): string {
		if (!dimension.xAxis || !dimension.yAxis) return 'Bitte X- und Y-Achse wählen.';
		const size = dimension.sizeAxis ? `, Größe: ${questionText(dimension.sizeAxis)}` : '';
		return `${questionText(dimension.xAxis)} vs. ${questionText(dimension.yAxis)} als ${chartLabels[dimension.chartType]}${size}`;
	}
</script>

<section>
	<h2>Dimensionen</h2>
	{#each dimensions as dimension, index (index)}
		<div class="dimension-card">
			<div class="dimension-header">
				<span class="dimension-id">Dimension {index + 1}</span>
				<button type="button" class="remove-btn" onclick={() => removeDimension(index)}>Entfernen</button>
			</div>
			<label class="field">
				<span class="label-text">X-Achse</span>
				<select bind:value={dimension.xAxis}>
					<option value="">Frage wählen</option>
					{#each questions as question (question.id)}
						<option value={question.id}>{question.text || question.id}</option>
					{/each}
				</select>
			</label>
			<label class="field">
				<span class="label-text">Y-Achse</span>
				<select bind:value={dimension.yAxis}>
					<option value="">Frage wählen</option>
					{#each questions as question (question.id)}
						<option value={question.id}>{question.text || question.id}</option>
					{/each}
				</select>
			</label>
			<label class="field">
				<span class="label-text">Größen-Achse (optional)</span>
				<select
					value={dimension.sizeAxis ?? ''}
					onchange={(event) => {
						const value = event.currentTarget.value;
						if (value) dimension.sizeAxis = value;
						else delete dimension.sizeAxis;
					}}
				>
					<option value="">Keine</option>
					{#each questions as question (question.id)}
						<option value={question.id}>{question.text || question.id}</option>
					{/each}
				</select>
			</label>
			<label class="field">
				<span class="label-text">Chart-Typ</span>
				<select bind:value={dimension.chartType}>
					{#each CHART_TYPES as chartType (chartType)}
						<option value={chartType}>{chartLabels[chartType]}</option>
					{/each}
				</select>
			</label>
			<p class="preview">{preview(dimension)}</p>
		</div>
	{/each}
	<button type="button" class="add-btn" onclick={addDimension} disabled={questions.length === 0}>
		Dimension hinzufügen
	</button>
</section>

<style>
	h2 {
		font-size: var(--font-size-h4);
		margin: 0 0 var(--space-2);
	}
	.dimension-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		margin-bottom: var(--space-2);
	}
	.dimension-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.dimension-id {
		font-size: var(--font-size-small);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-muted);
	}
	.remove-btn {
		font-size: var(--font-size-small);
		font-weight: 600;
		background: none;
		border: none;
		color: var(--color-muted);
		cursor: pointer;
		padding: 4px 8px;
		border-radius: 4px;
		transition: color 0.15s;
	}
	.remove-btn:hover {
		color: var(--color-accent);
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.label-text {
		font-size: var(--font-size-small);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-muted);
	}
	select {
		min-height: 40px;
		font-size: var(--font-size-body);
		font-family: inherit;
		padding: 8px 12px;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		background: var(--color-bg);
		color: var(--color-primary);
		transition: border-color 0.15s;
	}
	select:focus {
		outline: 2px solid var(--color-primary);
		outline-offset: 1px;
	}
	.preview {
		margin: 0;
		font-size: var(--font-size-small);
		color: var(--color-muted);
		font-style: italic;
	}
	.add-btn {
		min-height: 40px;
		padding: 0 16px;
		font-size: var(--font-size-body);
		font-weight: 700;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		background: transparent;
		color: var(--color-primary);
		cursor: pointer;
		transition: border-color 0.15s;
	}
	.add-btn:hover {
		border-color: var(--color-primary);
	}
	.add-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
