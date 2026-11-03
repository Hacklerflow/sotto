<script lang="ts">
	import SurveyForm from '../../../lib/components/SurveyForm.svelte';
	import SubmissionFlow from '../../../lib/components/SubmissionFlow.svelte';
	import { loadCredential } from '../../../lib/client/blind-requester';
	import type { SurveyParticipation } from '../../../lib/server/survey-participation';

	let { data }: { data: { surveyId: string; participation: SurveyParticipation } } = $props();

	let answers = $state<Record<string, unknown> | null>(null);
	const participation = $derived(data.participation);
	// Already signed and no credential left in this browser: the answer cannot be sent again.
	const alreadyParticipated = $derived(
		participation.state === 'open' &&
			participation.alreadySigned &&
			answers === null &&
			loadCredential(data.surveyId) === null
	);
</script>

{#if participation.state === 'not-invited'}
	<h1>Keine Einladung</h1>
	<p>Für diese Umfrage liegt keine Einladung für dich vor.</p>
{:else if participation.state === 'closed'}
	<h1>{participation.title}</h1>
	<p>Diese Umfrage ist beendet.</p>
{:else if participation.state === 'open'}
	<h1>{participation.title}</h1>
	{#if alreadyParticipated}
		<p>Du hast an dieser Umfrage bereits teilgenommen.</p>
	{:else if answers}
		<SubmissionFlow surveyId={data.surveyId} {answers} />
	{:else}
		<SurveyForm config={participation.config} onsubmit={(submitted) => (answers = submitted)} />
	{/if}
{/if}
