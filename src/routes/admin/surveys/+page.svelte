<script lang="ts">
	import { adminFetch } from '../../../lib/client/admin-session';
	import type { Survey } from '../../../lib/types/survey';

	let surveys = $state<Survey[]>([]);
	let loading = $state(true);

	$effect(() => {
		adminFetch('/api/admin/surveys')
			.then((response) => (response.ok ? response.json() : []))
			.then((data) => {
				surveys = data;
				loading = false;
			});
	});
</script>

<h1>Umfragen</h1>

{#if loading}
	<p>Laden …</p>
{:else if surveys.length === 0}
	<p>Noch keine Umfragen erstellt.</p>
{:else}
	<ul class="survey-list">
		{#each surveys as survey (survey.id)}
			<li>
				<a href="/admin/surveys/{survey.id}">{survey.title}</a>
				<span class="status">{survey.status}</span>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.survey-list {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.survey-list li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-2) var(--space-3);
		border: 2px solid var(--color-primary);
		border-radius: 12px;
	}
	.survey-list a {
		font-weight: 600;
		font-size: var(--font-size-h5);
	}
	.status {
		font-size: var(--font-size-small);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
</style>
