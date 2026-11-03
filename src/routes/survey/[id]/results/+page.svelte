<script lang="ts">
	import HeroNumber from '../../../../lib/components/HeroNumber.svelte';
	import InsightCard from '../../../../lib/components/InsightCard.svelte';
	import SankeyChart from '../../../../lib/components/charts/SankeyChart.svelte';
	import ScatterChart from '../../../../lib/components/charts/ScatterChart.svelte';
	import BubbleChart from '../../../../lib/components/charts/BubbleChart.svelte';
	import BarChart from '../../../../lib/components/charts/BarChart.svelte';
	import type { SurveyResults } from '../../../../lib/server/results';

	let { data }: { data: { results: Exclude<SurveyResults, { state: 'not-found' }> } } = $props();
	const results = $derived(data.results);

	function questionText(questions: { id: string; text: string }[], id: string): string {
		return questions.find((question) => question.id === id)?.text ?? id;
	}

	function insightType(correlation: number): 'strong-correlation' | 'weak-correlation' | null {
		const strength = Math.abs(correlation);
		if (strength >= 0.5) return 'strong-correlation';
		if (strength >= 0.2) return 'weak-correlation';
		return null;
	}
</script>

{#if results.state === 'waiting'}
	{@const missing = Math.max(0, results.requiredCount - results.responseCount)}
	<main>
		<h1>{results.title}</h1>
		<p class="waiting">Noch {missing} {missing === 1 ? 'Antwort' : 'Antworten'} nötig</p>
		<progress value={results.responseCount} max={results.requiredCount}></progress>
		<p>{results.responseCount} von {results.requiredCount} Antworten</p>
	</main>
{:else}
	{@const { config, aggregatedData } = results}
	<main>
		<h1>{results.title}</h1>
		<HeroNumber
			value={aggregatedData.responseCount}
			context="Antworten"
			subtitle="anonym ausgewertet"
		/>

		{#each aggregatedData.dimensions as dimension (dimension.index)}
			{@const dimensionConfig = config.dimensions[dimension.index]}
			{#if dimensionConfig}
				<section>
					<h2>
						{questionText(config.questions, dimension.xAxis)} / {questionText(
							config.questions,
							dimension.yAxis
						)}
					</h2>
					{#if dimension.points.length === 0}
						<p>Zu wenige Antworten für eine anonyme Darstellung.</p>
					{:else if dimension.chartType === 'sankey'}
						<SankeyChart data={dimension} config={dimensionConfig} />
					{:else if dimension.chartType === 'scatter'}
						<ScatterChart data={dimension} config={dimensionConfig} />
					{:else if dimension.chartType === 'bubble'}
						<BubbleChart data={dimension} config={dimensionConfig} />
					{:else}
						<BarChart data={dimension} config={dimensionConfig} />
					{/if}
				</section>
			{/if}
		{/each}

		{#each aggregatedData.dimensions as dimension (dimension.index)}
			{#if dimension.correlation !== null && insightType(dimension.correlation)}
				<InsightCard
					title="{questionText(config.questions, dimension.xAxis)} und {questionText(
						config.questions,
						dimension.yAxis
					)}"
					detail={dimension.correlation > 0
						? 'Höhere Werte gehen tendenziell mit höheren Werten einher.'
						: 'Höhere Werte gehen tendenziell mit niedrigeren Werten einher.'}
					type={insightType(dimension.correlation) ?? 'weak-correlation'}
					correlation={dimension.correlation}
				/>
			{/if}
		{/each}
	</main>
{/if}

<style>
	main {
		max-width: 64rem;
		margin: 0 auto;
		padding: var(--space-3) var(--space-2);
	}
	h1 {
		font-size: var(--font-size-h3);
		margin: 0;
	}
	h2 {
		font-size: var(--font-size-h4);
	}
	.waiting {
		font-size: var(--font-size-h2);
		font-weight: 900;
		line-height: 1.05;
	}
	progress {
		width: 100%;
		height: 16px;
		accent-color: var(--color-accent-red);
	}
	section {
		margin: var(--space-4) 0;
	}
	@media (max-width: 600px) {
		.waiting {
			font-size: 40px;
		}
	}
</style>
