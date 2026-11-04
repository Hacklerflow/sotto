<script lang="ts">
	import { page } from '$app/state';
	import { adminFetch } from '../../../../lib/client/admin-session';

	const surveyId = page.params.id;
	let progress = $state<{ invited: number; responded: number } | null>(null);

	$effect(() => {
		adminFetch(`/api/admin/surveys/${surveyId}/progress`)
			.then((response) => (response.ok ? response.json() : null))
			.then((data) => (progress = data));
	});
</script>

<h1>Umfrage {surveyId}</h1>
<p>Die Umfrage wurde angelegt.</p>
{#if progress}
	<p>{progress.invited} eingeladen, {progress.responded} Antworten.</p>
{/if}
<a href="/admin/surveys/{surveyId}/invitations">Teilnehmer einladen</a>
