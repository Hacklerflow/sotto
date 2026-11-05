<script lang="ts">
	import TrustBadge from '../../../lib/components/TrustBadge.svelte';
	import SurveyForm from '../../../lib/components/SurveyForm.svelte';
	import SubmissionFlow from '../../../lib/components/SubmissionFlow.svelte';
	import { loadCredential } from '../../../lib/client/blind-requester';
	import type { SurveyParticipation } from '../../../lib/server/survey-participation';

	let { data }: { data: { surveyId: string; participation: SurveyParticipation } } = $props();

	let answers = $state<Record<string, unknown> | null>(null);
	const participation = $derived(data.participation);
	const alreadyParticipated = $derived(
		participation.state === 'open' &&
			participation.alreadySigned &&
			answers === null &&
			loadCredential(data.surveyId) === null
	);
</script>

{#if participation.state === 'not-invited'}
	<main class="state-page">
		<p class="logo">sotto</p>
		<h1>Keine Einladung</h1>
		<p class="state-text">Für diese Umfrage liegt keine Einladung für dich vor.</p>
		<a href="/" class="back-link">Zur Startseite</a>
	</main>
{:else if participation.state === 'closed'}
	<main class="state-page">
		<p class="logo">sotto</p>
		<h1>{participation.title}</h1>
		<p class="state-text">Diese Umfrage ist beendet.</p>
		<a href="/survey/{data.surveyId}/results" class="results-link">Ergebnisse ansehen</a>
	</main>
{:else if participation.state === 'open'}
	{#if alreadyParticipated}
		<main class="state-page">
			<p class="logo">sotto</p>
			<h1>{participation.title}</h1>
			<p class="state-text">Du hast an dieser Umfrage bereits teilgenommen. Danke!</p>
		</main>
	{:else if answers}
		<main>
			<SubmissionFlow surveyId={data.surveyId} {answers} />
		</main>
	{:else}
		<main>
			<header class="survey-header">
				<p class="logo-small">sotto</p>
				<h1>{participation.title}</h1>
				<p class="anonymous-hint">Deine Antworten werden kryptografisch anonymisiert.</p>
			</header>
			<SurveyForm config={participation.config} onsubmit={(submitted) => (answers = submitted)} />
		</main>
	{/if}
{/if}

<footer class="trust"><TrustBadge /></footer>

<style>
	main {
		max-width: 48rem;
		margin: 0 auto;
		padding: var(--space-3) var(--space-2);
	}
	.state-page {
		min-height: 70dvh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
	}
	.logo {
		font-size: clamp(2rem, 10vw, 3rem);
		font-weight: 900;
		letter-spacing: -0.04em;
		line-height: 1;
		margin: 0 0 var(--space-2);
	}
	.logo-small {
		font-size: 1.5rem;
		font-weight: 900;
		letter-spacing: -0.04em;
		margin: 0;
		color: var(--color-muted);
	}
	h1 {
		font-size: var(--font-size-h3);
		margin: 0 0 var(--space-1);
	}
	.state-text {
		color: var(--color-muted);
		line-height: 1.6;
		margin: var(--space-1) 0 var(--space-3);
		max-width: 28rem;
	}
	.back-link,
	.results-link {
		display: inline-flex;
		align-items: center;
		min-height: 48px;
		padding: 0 24px;
		background: var(--color-primary);
		color: var(--color-bg);
		border-radius: 8px;
		font-weight: 700;
		text-decoration: none;
	}
	.back-link:hover,
	.results-link:hover {
		opacity: 0.85;
	}
	.survey-header {
		margin-bottom: var(--space-3);
	}
	.anonymous-hint {
		font-size: var(--font-size-small);
		color: var(--color-muted);
		margin: var(--space-1) 0 0;
	}
	.trust {
		max-width: 48rem;
		margin: 0 auto;
		padding: var(--space-2);
	}
</style>
