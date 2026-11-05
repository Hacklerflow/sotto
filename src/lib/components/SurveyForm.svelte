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
					<button type="button" class="nav-btn secondary" onclick={() => scrollToStep(index - 1)}>
						Zurück
					</button>
				{/if}
				{#if index < total - 1}
					<button
						type="button"
						class="nav-btn primary"
						disabled={values[question.id] == null}
						onclick={() => scrollToStep(index + 1)}
					>
						Weiter
					</button>
				{:else}
					<button
						type="button"
						class="nav-btn primary"
						disabled={values[question.id] == null}
						onclick={() => scrollToStep(total)}
					>
						Zusammenfassung
					</button>
				{/if}
			</div>
		</section>
	{/each}

	<section class="step summary" class:active={activeStep === total} id="step-{total}" aria-label="Zusammenfassung">
		<h2>Zusammenfassung</h2>
		<p class="summary-intro">Prüfe deine Antworten vor dem Absenden.</p>
		<dl class="summary-list">
			{#each config.questions as question, index (question.id)}
				<div class="summary-item" role="button" tabindex="0" onclick={() => scrollToStep(index)} onkeydown={(event) => event.key === 'Enter' && scrollToStep(index)}>
					<dt>{question.text}</dt>
					<dd class:unanswered={values[question.id] == null}>{formatAnswer(values[question.id])}</dd>
				</div>
			{/each}
		</dl>
		{#if !complete}
			<p class="hint">Bitte beantworte alle Fragen ({answeredCount} von {total}).</p>
		{/if}
		<button type="submit" class="submit-btn" disabled={!complete}>Anonym absenden</button>
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
		height: 4px;
		background: var(--color-border);
		z-index: 1;
		border-radius: 2px;
	}
	.progress-bar {
		height: 100%;
		background: var(--color-primary);
		border-radius: 2px;
		transition: width 0.3s ease;
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
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-muted);
		margin: 0;
	}
	.step-nav {
		display: flex;
		gap: var(--space-2);
	}
	.nav-btn {
		min-height: 48px;
		min-width: 48px;
		padding: 0 24px;
		font-size: var(--font-size-body);
		font-weight: 700;
		border-radius: 8px;
		cursor: pointer;
	}
	.nav-btn.primary {
		background: var(--color-primary);
		color: var(--color-bg);
		border: none;
	}
	.nav-btn.secondary {
		background: transparent;
		color: var(--color-primary);
		border: 1px solid var(--color-border);
	}
	.nav-btn.secondary:hover {
		border-color: var(--color-primary);
	}
	.nav-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	h2 {
		font-size: var(--font-size-h3);
		margin: 0;
	}
	.summary-intro {
		color: var(--color-muted);
		margin: 0;
	}
	.summary-list {
		margin: var(--space-2) 0 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	.summary-item {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		cursor: pointer;
		transition: border-color 0.15s;
	}
	.summary-item:hover {
		border-color: var(--color-primary);
	}
	dt {
		font-weight: 600;
		font-size: var(--font-size-small);
		margin: 0;
	}
	dd {
		margin: 4px 0 0;
	}
	dd.unanswered {
		color: var(--color-accent);
		font-style: italic;
	}
	.hint {
		font-size: var(--font-size-small);
		color: var(--color-accent);
		font-weight: 600;
	}
	.submit-btn {
		align-self: flex-start;
		min-height: 56px;
		padding: 0 32px;
		font-size: var(--font-size-h5);
		font-weight: 700;
		border-radius: 12px;
		border: none;
		background: var(--color-primary);
		color: var(--color-bg);
		cursor: pointer;
		transition: opacity 0.15s;
	}
	.submit-btn:hover {
		opacity: 0.85;
	}
	.submit-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
