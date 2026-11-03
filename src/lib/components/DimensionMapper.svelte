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
		<fieldset>
			<legend>Dimension {index + 1}</legend>
			<label>
				X-Achse
				<select bind:value={dimension.xAxis}>
					<option value="">Frage wählen</option>
					{#each questions as question (question.id)}
						<option value={question.id}>{question.text || question.id}</option>
					{/each}
				</select>
			</label>
			<label>
				Y-Achse
				<select bind:value={dimension.yAxis}>
					<option value="">Frage wählen</option>
					{#each questions as question (question.id)}
						<option value={question.id}>{question.text || question.id}</option>
					{/each}
				</select>
			</label>
			<label>
				Größen-Achse (optional)
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
			<label>
				Chart-Typ
				<select bind:value={dimension.chartType}>
					{#each CHART_TYPES as chartType (chartType)}
						<option value={chartType}>{chartLabels[chartType]}</option>
					{/each}
				</select>
			</label>
			<p class="preview">{preview(dimension)}</p>
			<button type="button" onclick={() => removeDimension(index)}>Dimension entfernen</button>
		</fieldset>
	{/each}
	<button type="button" onclick={addDimension} disabled={questions.length === 0}>
		Dimension hinzufügen
	</button>
</section>

<style>
	fieldset {
		display: grid;
		gap: var(--space-1);
		margin-bottom: var(--space-2);
	}
	label {
		display: grid;
		gap: 0.25rem;
	}
	.preview {
		margin: 0;
		font-size: var(--font-size-small);
	}
</style>
