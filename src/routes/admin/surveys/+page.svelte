<script lang="ts">
	import { adminFetch } from '../../../lib/client/admin-session';
	import type { Survey } from '../../../lib/types/survey';

	let surveys = $state<Survey[]>([]);
	let loading = $state(true);
	let progressMap = $state<Record<string, { invited: number; responded: number }>>({});

	$effect(() => {
		adminFetch('/api/admin/surveys')
			.then((response) => (response.ok ? response.json() : []))
			.then((data: Survey[]) => {
				surveys = data;
				loading = false;
				for (const survey of data) {
					adminFetch(`/api/admin/surveys/${survey.id}/progress`)
						.then((response) => (response.ok ? response.json() : null))
						.then((progress) => {
							if (progress) progressMap[survey.id] = progress;
						});
				}
			});
	});

	function questionCount(survey: Survey): number {
		return survey.config?.questions?.length ?? 0;
	}

	function progressLabel(surveyId: string): string {
		const p = progressMap[surveyId];
		if (!p) return '';
		return `${p.responded}/${p.invited}`;
	}
</script>

<h1>Umfragen</h1>

{#if loading}
	<p>Laden …</p>
{:else if surveys.length === 0}
	<p>Noch keine Umfragen erstellt. <a href="/admin/surveys/new">Jetzt eine erstellen</a></p>
{:else}
	<ul class="survey-list">
		{#each surveys as survey (survey.id)}
			<li>
				<a href="/admin/surveys/{survey.id}" class="survey-link">
					<div class="survey-header">
						<span class="survey-title">{survey.title}</span>
						<span class="status-badge" class:open={survey.status === 'open'} class:closed={survey.status === 'closed'}>
							{survey.status === 'open' ? 'Offen' : 'Abgeschlossen'}
						</span>
					</div>
					<div class="survey-meta">
						<span>{questionCount(survey)} Fragen</span>
						{#if progressMap[survey.id]}
							<span>{progressLabel(survey.id)} Antworten</span>
						{/if}
					</div>
				</a>
			</li>
		{/each}
	</ul>
{/if}

<style>
	h1 {
		font-size: var(--font-size-h3);
		margin-bottom: var(--space-3);
	}
	.survey-list {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.survey-list li {
		border: 1px solid #e0e0e0;
		border-radius: 12px;
		transition: border-color 0.15s;
	}
	.survey-list li:hover {
		border-color: var(--color-primary);
	}
	.survey-link {
		display: block;
		padding: var(--space-2) var(--space-3);
		text-decoration: none;
	}
	.survey-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-2);
	}
	.survey-title {
		font-weight: 700;
		font-size: var(--font-size-h5);
	}
	.status-badge {
		display: inline-block;
		padding: 2px 10px;
		border-radius: 100px;
		font-size: 12px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		white-space: nowrap;
	}
	.status-badge.open {
		background: #e8f5e9;
		color: #2e7d32;
	}
	.status-badge.closed {
		background: #f3e5f5;
		color: #7b1fa2;
	}
	.survey-meta {
		display: flex;
		gap: var(--space-2);
		margin-top: 4px;
		font-size: var(--font-size-small);
		color: var(--color-muted);
	}
</style>
