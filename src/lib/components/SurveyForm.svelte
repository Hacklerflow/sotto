<script lang="ts">
	import type { SurveyConfig } from '../types/survey';
	import QuestionInput, { type AnswerValue } from './QuestionInput.svelte';

	let {
		config,
		onsubmit = () => {}
	}: {
		config: SurveyConfig;
		onsubmit?: (answers: Record<string, unknown>) => void;
	} = $props();

	// The config is fixed for the lifetime of the form, so the initial value is intended.
	// svelte-ignore state_referenced_locally
	let values = $state<Record<string, AnswerValue>>(
		Object.fromEntries(config.questions.map((question) => [question.id, null]))
	);
	let activeStep = $state(0);

	const answeredCount = $derived(
		config.questions.filter((question) => values[question.id] != null).length
	);
	const total = $derived(config.questions.length);
	const complete = $derived(answeredCount === total);
	const progressPercent = $derived(total === 0 ? 100 : Math.round((answeredCount / total) * 100));

	function scrollToStep(index: number): void {
		activeStep = index;
		document.getElementById(`step-${index}`)?.scrollIntoView({ behavior: 'smooth' });
	}

	function formatAnswer(value: AnswerValue): string {
		if (value == null) return '–';
		return Array.isArray(value) ? value.join(', ') : String(value);
	}

	function handleSubmit(event: SubmitEvent): void {
		event.preventDefault();
		if (!complete) return;
		const answers: Record<string, unknown> = {};
		for (const question of config.questions) answers[question.id] = values[question.id];
		onsubmit(answers);
	}
</script>

<form class="survey-form" onsubmit={handleSubmit}>
	<div
		class="progress"
		role="progressbar"
		aria-valuemin="0"
		aria-valuemax={total}
		aria-valuenow={answeredCount}
		aria-label="Fortschritt"
	>
		<div class="progress-bar" style:width="{progressPercent}%"></div>
	</div>

	{#each config.questions as question, index (question.id)}
		<section class="step" class:active={activeStep === index} id="step-{index}">
			<p class="step-count">Frage {index + 1} von {total}</p>
			<QuestionInput {question} bind:value={values[question.id]} />
			<div class="step-nav">
				{#if index > 0}
					<button type="button" class="secondary" onclick={() => scrollToStep(index - 1)}>
						Zurück
					</button>
				{/if}
				{#if index < total - 1}
					<button
						type="button"
						class="primary"
						disabled={values[question.id] == null}
						onclick={() => scrollToStep(index + 1)}
					>
						Weiter
					</button>
				{/if}
			</div>
		</section>
	{/each}

	<section class="step summary" class:active={activeStep === total} id="step-{total}" aria-label="Zusammenfassung">
		<h2>Zusammenfassung</h2>
		<dl>
			{#each config.questions as question (question.id)}
				<dt>{question.text}</dt>
				<dd>{formatAnswer(values[question.id])}</dd>
			{/each}
		</dl>
		{#if !complete}
			<p class="hint">Bitte beantworte alle Fragen ({answeredCount} von {total}).</p>
		{/if}
		<button type="submit" class="primary" disabled={!complete}>Anonym absenden</button>
	</section>
</form>

<style>
	.survey-form {
		display: flex;
		flex-direction: column;
	}
	.progress {
		position: sticky;
		top: 0;
		height: 8px;
		background: #e5e5ea;
		z-index: 1;
	}
	.progress-bar {
		height: 100%;
		background: var(--color-accent-green);
		transition: width 0.2s;
	}
	.step {
		min-height: 80dvh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		gap: var(--space-3);
		padding: var(--space-3) 0;
		scroll-margin-top: 8px;
		opacity: 0.3;
		transition: opacity 0.3s;
	}
	.step.active {
		opacity: 1;
	}
	.step-count {
		font-size: var(--font-size-small);
		margin: 0;
	}
	.step-nav {
		display: flex;
		gap: var(--space-1);
	}
	button {
		min-height: 48px;
		min-width: 48px;
		padding: 0 var(--space-3);
		font-size: var(--font-size-body);
		font-weight: 600;
		border-radius: 12px;
		border: 2px solid var(--color-primary);
		cursor: pointer;
	}
	button.primary {
		background: var(--color-primary);
		color: var(--color-bg);
	}
	button.secondary {
		background: var(--color-bg);
		color: var(--color-primary);
	}
	button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	dt {
		font-weight: 600;
		margin-top: var(--space-2);
	}
	dd {
		margin: 0;
	}
	.hint {
		font-size: var(--font-size-small);
	}
</style>
