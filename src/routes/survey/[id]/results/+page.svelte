<script lang="ts">
	import TrustBadge from '../../../../lib/components/TrustBadge.svelte';
	import HeroNumber from '../../../../lib/components/HeroNumber.svelte';
	import InsightCard from '../../../../lib/components/InsightCard.svelte';
	import SankeyChart from '../../../../lib/components/charts/SankeyChart.svelte';
	import ScatterChart from '../../../../lib/components/charts/ScatterChart.svelte';
	import BubbleChart from '../../../../lib/components/charts/BubbleChart.svelte';
	import BarChart from '../../../../lib/components/charts/BarChart.svelte';
	import DistributionBar from '../../../../lib/components/charts/DistributionBar.svelte';
	import Explorer from '../../../../lib/components/Explorer.svelte';
	import type { SurveyResults } from '../../../../lib/server/results';

	let { data }: { data: { results: Exclude<SurveyResults, { state: 'not-found' }>; surveyId: string } } = $props();
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
	<main class="waiting-page">
		<p class="logo">sotto</p>
		<h1>{results.title}</h1>
		<div class="waiting-card">
			<p class="waiting-count">
				Noch <span class="waiting-number">{missing}</span> {missing === 1 ? 'Antwort' : 'Antworten'} nötig
			</p>
			<div class="progress-track">
				<div class="progress-fill" style="width: {Math.round((results.responseCount / results.requiredCount) * 100)}%"></div>
			</div>
			<p class="progress-label">{results.responseCount} von {results.requiredCount} Antworten</p>
			<p class="waiting-hint">
				Ergebnisse erscheinen erst, wenn genug Personen teilgenommen haben,
				damit sich niemand herauslesen lässt.
			</p>
		</div>
	</main>
{:else}
	{@const { config, aggregatedData } = results}
	<main>
		<header class="results-header">
			<p class="logo-small">sotto</p>
			<h1>{results.title}</h1>
		</header>

		<HeroNumber
			value={aggregatedData.responseCount}
			context="Antworten"
			subtitle="anonym ausgewertet"
		/>

		{#each aggregatedData.dimensions as dimension (dimension.index)}
			{@const dimensionConfig = config.dimensions[dimension.index]}
			{#if dimensionConfig}
				<section class="chart-section">
					<h2>
						{questionText(config.questions, dimension.xAxis)} / {questionText(
							config.questions,
							dimension.yAxis
						)}
					</h2>
					{#if dimension.points.length === 0}
						<p class="empty">Zu wenige Antworten für eine anonyme Darstellung.</p>
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

		{#if aggregatedData.categories?.length > 0}
			{#each aggregatedData.categories as distribution (distribution.questionId)}
				<section class="chart-section">
					<h2>{distribution.questionText}</h2>
					<DistributionBar {distribution} />
				</section>
			{/each}
		{/if}

		{#if aggregatedData.dimensions.some((dimension) => dimension.correlation !== null && insightType(dimension.correlation))}
			<section class="insights-section">
				<h2>Erkenntnisse</h2>
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
			</section>
		{/if}

		<section class="explorer-section">
			<Explorer surveyId={data.surveyId} questions={config.questions} />
		</section>
	</main>
{/if}

<footer class="trust"><TrustBadge /></footer>

<style>
	main {
		max-width: 64rem;
		margin: 0 auto;
		padding: var(--space-3) var(--space-2);
	}
	.logo {
		font-size: clamp(2rem, 10vw, 3rem);
		font-weight: 900;
		letter-spacing: -0.04em;
		line-height: 1;
		margin: 0;
	}
	.logo-small {
		font-size: 1.5rem;
		font-weight: 900;
		letter-spacing: -0.04em;
		margin: 0;
		color: var(--color-muted);
	}
	.results-header {
		margin-bottom: var(--space-3);
	}
	h1 {
		font-size: var(--font-size-h3);
		margin: var(--space-1) 0 0;
	}
	h2 {
		font-size: var(--font-size-h4);
		margin: 0 0 var(--space-2);
	}
	.waiting-page {
		min-height: 80dvh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
	}
	.waiting-card {
		max-width: 28rem;
		margin-top: var(--space-3);
	}
	.waiting-count {
		font-size: var(--font-size-h4);
		font-weight: 700;
		margin: 0 0 var(--space-2);
	}
	.waiting-number {
		font-size: var(--font-size-h2);
		font-weight: 900;
	}
	.progress-track {
		height: 8px;
		background: var(--color-border);
		border-radius: 4px;
		overflow: hidden;
	}
	.progress-fill {
		height: 100%;
		background: var(--color-primary);
		border-radius: 4px;
		transition: width 0.4s ease;
	}
	.progress-label {
		font-size: var(--font-size-small);
		color: var(--color-muted);
		margin: var(--space-1) 0 0;
	}
	.waiting-hint {
		font-size: var(--font-size-small);
		color: var(--color-muted);
		margin-top: var(--space-3);
		line-height: 1.6;
	}
	.chart-section {
		margin: var(--space-4) 0;
		padding: var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: 12px;
	}
	.empty {
		color: var(--color-muted);
	}
	.insights-section {
		margin: var(--space-4) 0;
	}
	.insights-section h2 {
		font-size: var(--font-size-h5);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-muted);
	}
	.explorer-section {
		margin: var(--space-4) 0;
	}
	.trust {
		max-width: 64rem;
		margin: 0 auto;
		padding: var(--space-2);
	}
	@media (max-width: 600px) {
		.waiting-number {
			font-size: 40px;
		}
		.chart-section {
			padding: var(--space-2);
		}
	}
</style>
