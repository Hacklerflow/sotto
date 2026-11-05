<script lang="ts">
	import { page } from '$app/state';
	import { adminFetch } from '../../../../lib/client/admin-session';
	import type { SurveyConfig } from '../../../../lib/types/survey';

	const surveyId = page.params.id;

	interface SurveyData {
		id: string;
		title: string;
		status: string;
		config: SurveyConfig;
	}

	let survey = $state<SurveyData | null>(null);
	let progress = $state<{ invited: number; responded: number } | null>(null);
	let loading = $state(true);
	let loadError = $state(false);
	let freezing = $state(false);
	let freezeError = $state('');
	let freezeSuccess = $state(false);
	let copied = $state(false);
	let toggling = $state(false);
	let deleting = $state(false);
	let confirmDelete = $state(false);

	$effect(() => {
		adminFetch(`/api/admin/surveys/${surveyId}`)
			.then((response) => {
				if (!response.ok) throw new Error();
				return response.json();
			})
			.then((data) => {
				survey = data;
			})
			.catch(() => {
				loadError = true;
			})
			.finally(() => {
				loading = false;
			});
		adminFetch(`/api/admin/surveys/${surveyId}/progress`)
			.then((response) => (response.ok ? response.json() : null))
			.then((data) => (progress = data));
	});

	const progressPercent = $derived(
		progress && progress.invited > 0
			? Math.round((progress.responded / progress.invited) * 100)
			: 0
	);

	const resultsUrl = $derived(
		typeof window !== 'undefined'
			? `${window.location.origin}/survey/${surveyId}/results`
			: `/survey/${surveyId}/results`
	);

	const chartTypeLabels: Record<string, string> = {
		scatter: 'Streudiagramm',
		bar: 'Balkendiagramm',
		sankey: 'Sankey',
		bubble: 'Blasendiagramm'
	};

	const questionTypeLabels: Record<string, string> = {
		number: 'Zahl',
		'single-choice': 'Single-Choice',
		'multi-choice': 'Multi-Choice',
		range: 'Range'
	};

	async function freezeSurvey() {
		freezing = true;
		freezeError = '';
		try {
			const response = await adminFetch(`/api/admin/surveys/${surveyId}/freeze`, {
				method: 'POST'
			});
			const result = await response.json();
			if (!response.ok) {
				freezeError = result.error ?? `Fehler ${response.status}`;
				return;
			}
			freezeSuccess = true;
			if (survey) survey.status = 'closed';
		} catch {
			freezeError = 'Verbindungsfehler.';
		} finally {
			freezing = false;
		}
	}

	async function copyResultsLink() {
		await navigator.clipboard.writeText(resultsUrl);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	async function deleteSurvey() {
		deleting = true;
		try {
			const response = await adminFetch(`/api/admin/surveys/${surveyId}`, { method: 'DELETE' });
			if (response.ok) {
				window.location.href = '/admin/surveys';
			}
		} finally {
			deleting = false;
		}
	}

	async function toggleStatus() {
		if (!survey) return;
		toggling = true;
		const newStatus = survey.status === 'open' ? 'closed' : 'open';
		try {
			const response = await adminFetch(`/api/admin/surveys/${surveyId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ status: newStatus })
			});
			if (response.ok) {
				survey.status = newStatus;
			}
		} finally {
			toggling = false;
		}
	}
</script>

<main>
	<a href="/admin/surveys" class="back">&larr; Alle Umfragen</a>

	{#if loading}
		<p class="loading">Laden …</p>
	{:else if loadError || !survey}
		<h1>Umfrage nicht gefunden</h1>
		<p class="load-error">Die Umfrage konnte nicht geladen werden.</p>
	{:else}

	<h1>{survey.title}</h1>

	<span class="status-badge" class:open={survey.status === 'open'} class:closed={survey.status === 'closed'}>
		{survey.status === 'open' ? 'Offen' : 'Abgeschlossen'}
	</span>

	{#if progress}
		<section class="progress-section">
			<div class="progress-header">
				<span class="progress-numbers">
					{progress.responded} / {progress.invited} Antworten
				</span>
				<span class="progress-percent">{progressPercent} %</span>
			</div>
			<div class="progress-bar">
				<div class="progress-fill" style="width: {progressPercent}%"></div>
			</div>
		</section>
	{/if}

	<nav class="actions">
		<a href="/admin/surveys/{surveyId}/invitations" class="action-btn">Teilnehmer einladen</a>
		<a href="/survey/{surveyId}/results" class="action-btn">Ergebnisse ansehen</a>
		<a href="/api/admin/surveys/{surveyId}/export" class="action-btn secondary" download>CSV-Export</a>
		<button type="button" class="action-btn secondary" onclick={copyResultsLink}>
			{copied ? 'Kopiert!' : 'Ergebnis-Link kopieren'}
		</button>
		<button type="button" class="action-btn" class:danger={survey.status === 'open'} disabled={toggling} onclick={toggleStatus}>
			{toggling ? '…' : survey.status === 'open' ? 'Umfrage schließen' : 'Umfrage wieder öffnen'}
		</button>
		{#if confirmDelete}
			<button type="button" class="action-btn danger" disabled={deleting} onclick={deleteSurvey}>
				{deleting ? 'Wird gelöscht …' : 'Wirklich löschen'}
			</button>
			<button type="button" class="action-btn secondary" onclick={() => (confirmDelete = false)}>Abbrechen</button>
		{:else}
			<button type="button" class="action-btn secondary delete-trigger" onclick={() => (confirmDelete = true)}>Löschen</button>
		{/if}
	</nav>

	{#if survey.status === 'open'}
		<section class="freeze-section">
			<h2>Umfrage abschließen</h2>
			<p>Anonymisiert die Antworten und erstellt den Ergebnis-Snapshot. Danach können keine weiteren Antworten abgegeben werden.</p>
			{#if freezeError}<p class="error">{freezeError}</p>{/if}
			{#if freezeSuccess}
				<p class="success">Ergebnis-Snapshot erstellt. Die Ergebnisse sind jetzt verfügbar.</p>
			{:else}
				<button type="button" class="freeze-btn" disabled={freezing} onclick={freezeSurvey}>
					{freezing ? 'Wird abgeschlossen …' : 'Umfrage abschließen & einfrieren'}
				</button>
			{/if}
		</section>
	{/if}

	{#if survey.config}
		{@const config = survey.config}
		<section class="config-section">
			<h2>Fragen ({config.questions.length})</h2>
			<div class="question-list">
				{#each config.questions as question, index (question.id)}
					<div class="question-card">
						<div class="question-header">
							<span class="question-id">{question.id}</span>
							<span class="question-type">{questionTypeLabels[question.type] ?? question.type}</span>
						</div>
						<p class="question-text">{question.text}</p>
						{#if question.options && question.options.length > 0}
							<div class="question-options">
								{#each question.options as option}
									<span class="option-tag">{option}</span>
								{/each}
							</div>
						{/if}
						{#if question.unit}
							<span class="question-unit">Einheit: {question.unit}</span>
						{/if}
						{#if question.range}
							<span class="question-unit">Range: {question.range.min}–{question.range.max}</span>
						{/if}
					</div>
				{/each}
			</div>

			{#if config.dimensions.length > 0}
				<h2>Dimensionen ({config.dimensions.length})</h2>
				<div class="dimension-list">
					{#each config.dimensions as dimension, index}
						{@const xQuestion = config.questions.find((q) => q.id === dimension.xAxis)}
						{@const yQuestion = config.questions.find((q) => q.id === dimension.yAxis)}
						<div class="dimension-card">
							<span class="dimension-chart">{chartTypeLabels[dimension.chartType] ?? dimension.chartType}</span>
							<span class="dimension-axes">
								{xQuestion?.text ?? dimension.xAxis} &times; {yQuestion?.text ?? dimension.yAxis}
							</span>
						</div>
					{/each}
				</div>
			{/if}
		</section>
	{/if}
	{/if}
</main>

<style>
	main {
		max-width: 64rem;
		margin: 0 auto;
		padding: var(--space-3) var(--space-2);
	}
	.back {
		font-size: var(--font-size-small);
		color: var(--color-muted);
		display: inline-block;
		margin-bottom: var(--space-2);
	}
	.back:hover {
		color: var(--color-primary);
	}
	.loading {
		color: var(--color-muted);
	}
	.load-error {
		color: var(--color-accent);
	}
	h1 {
		font-size: var(--font-size-h3);
		margin-bottom: var(--space-1);
	}
	h2 {
		font-size: var(--font-size-h5);
		margin-top: var(--space-4);
		margin-bottom: var(--space-2);
	}
	.status-badge {
		display: inline-block;
		padding: 4px 12px;
		border-radius: 100px;
		font-size: var(--font-size-small);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.status-badge.open {
		background: var(--color-success-bg);
		color: var(--color-success);
	}
	.status-badge.closed {
		background: var(--color-info-bg);
		color: var(--color-info);
	}
	.progress-section {
		margin-top: var(--space-3);
	}
	.progress-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 6px;
	}
	.progress-numbers {
		font-weight: 700;
	}
	.progress-percent {
		font-size: var(--font-size-small);
		color: var(--color-muted);
	}
	.progress-bar {
		width: 100%;
		height: 8px;
		background: var(--color-surface);
		border-radius: 4px;
		overflow: hidden;
	}
	.progress-fill {
		height: 100%;
		background: var(--color-primary);
		border-radius: 4px;
		transition: width 0.3s ease;
	}
	.actions {
		display: flex;
		gap: var(--space-2);
		margin-top: var(--space-3);
		flex-wrap: wrap;
	}
	.action-btn {
		padding: 10px 20px;
		border: 2px solid var(--color-primary);
		border-radius: 8px;
		font-weight: 700;
		font-size: var(--font-size-small);
		cursor: pointer;
		background: var(--color-primary);
		color: var(--color-bg);
		text-decoration: none;
		transition: opacity 0.15s;
	}
	.action-btn:hover {
		opacity: 0.85;
	}
	.action-btn.secondary {
		background: transparent;
		color: var(--color-primary);
	}
	.action-btn.danger {
		background: var(--color-accent);
		border-color: var(--color-accent);
		color: var(--color-on-primary);
	}
	.delete-trigger {
		color: var(--color-muted);
		border-color: var(--color-border);
	}
	.freeze-section {
		margin-top: var(--space-4);
		padding: var(--space-3);
		border: 2px solid var(--color-accent);
		border-radius: 12px;
	}
	.freeze-section h2 {
		margin-top: 0;
		color: var(--color-accent);
	}
	.freeze-section p {
		margin: 0 0 var(--space-2);
		font-size: var(--font-size-small);
		color: var(--color-muted);
	}
	.freeze-btn {
		padding: 12px 24px;
		background: var(--color-accent);
		color: var(--color-on-primary);
		border: none;
		border-radius: 8px;
		font-weight: 700;
		font-size: var(--font-size-body);
		cursor: pointer;
		transition: opacity 0.15s;
	}
	.freeze-btn:hover:not(:disabled) {
		opacity: 0.85;
	}
	.freeze-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.error {
		color: var(--color-accent) !important;
		font-weight: 600;
	}
	.success {
		color: #2e7d32 !important;
		font-weight: 600;
	}
	.config-section {
		margin-top: var(--space-3);
	}
	.question-list {
		display: grid;
		gap: var(--space-2);
	}
	.question-card {
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: 8px;
	}
	.question-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 4px;
	}
	.question-id {
		font-family: monospace;
		font-size: var(--font-size-small);
		color: var(--color-muted);
	}
	.question-type {
		font-size: 12px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-muted);
		background: var(--color-surface);
		padding: 2px 8px;
		border-radius: 4px;
	}
	.question-text {
		margin: 0;
		font-weight: 600;
	}
	.question-options {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 8px;
	}
	.option-tag {
		font-size: 13px;
		padding: 2px 10px;
		border: 1px solid var(--color-border);
		border-radius: 100px;
		color: var(--color-muted);
	}
	.question-unit {
		display: block;
		font-size: var(--font-size-small);
		color: var(--color-muted);
		margin-top: 4px;
	}
	.dimension-list {
		display: grid;
		gap: var(--space-1);
	}
	.dimension-card {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: 10px var(--space-2);
		border: 1px solid var(--color-border);
		border-radius: 8px;
	}
	.dimension-chart {
		font-size: 12px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 2px 8px;
		border-radius: 4px;
		background: var(--color-surface);
		white-space: nowrap;
	}
	.dimension-axes {
		font-size: var(--font-size-small);
	}
	@media (max-width: 600px) {
		.actions {
			flex-direction: column;
		}
		.action-btn {
			text-align: center;
		}
	}
</style>
