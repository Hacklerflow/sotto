<script lang="ts">
	import { page } from '$app/state';
	import { adminFetch } from '../../../../lib/client/admin-session';

	const surveyId = page.params.id;
	let title = $state<string | null>(null);
	let progress = $state<{ invited: number; responded: number } | null>(null);

	$effect(() => {
		adminFetch(`/api/admin/surveys/${surveyId}`)
			.then((response) => (response.ok ? response.json() : null))
			.then((data) => {
				if (data) title = data.title;
			});
		adminFetch(`/api/admin/surveys/${surveyId}/progress`)
			.then((response) => (response.ok ? response.json() : null))
			.then((data) => (progress = data));
	});
</script>

<h1>{title ?? 'Umfrage …'}</h1>
{#if progress}
	<p>{progress.invited} eingeladen, {progress.responded} Antworten.</p>
{/if}
<nav class="actions">
	<a href="/admin/surveys/{surveyId}/invitations">Teilnehmer einladen</a>
	<a href="/survey/{surveyId}/results">Ergebnisse ansehen</a>
</nav>

<style>
	.actions {
		display: flex;
		gap: var(--space-2);
		margin-top: var(--space-2);
	}
	.actions a {
		font-weight: 700;
	}
</style>
