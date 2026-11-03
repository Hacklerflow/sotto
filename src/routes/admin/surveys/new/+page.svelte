<script lang="ts">
	import { goto } from '$app/navigation';
	import { adminFetch } from '../../../../lib/client/admin-session';
	import DimensionMapper from '../../../../lib/components/DimensionMapper.svelte';
	import QuestionEditor from '../../../../lib/components/QuestionEditor.svelte';
	import { validateSurveyConfig, type Dimension, type Question } from '../../../../lib/types/survey';

	let title = $state('');
	let questions = $state<Question[]>([]);
	let dimensions = $state<Dimension[]>([]);
	let errorMessage = $state('');
	let submitting = $state(false);

	function cleanQuestions(): Question[] {
		return $state.snapshot(questions).map((question) => ({
			...question,
			text: question.text.trim(),
			options: question.options?.map((option) => option.trim()).filter((option) => option !== '')
		}));
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		errorMessage = '';
		const config = {
			questions: cleanQuestions(),
			dimensions: $state.snapshot(dimensions),
			visualizations: $state.snapshot(dimensions).map((_, dimensionIndex) => ({ dimensionIndex }))
		};
		if (title.trim() === '') {
			errorMessage = 'Titel fehlt.';
			return;
		}
		try {
			validateSurveyConfig(config);
		} catch (cause) {
			errorMessage = cause instanceof Error ? cause.message : 'Ungültige Konfiguration.';
			return;
		}
		submitting = true;
		try {
			const response = await adminFetch('/api/admin/surveys', {
				method: 'POST',
				body: JSON.stringify({ title: title.trim(), config })
			});
			if (!response.ok) {
				errorMessage =
					response.status === 401
						? 'Admin-Secret ungültig. Bitte abmelden und neu eingeben.'
						: `Fehler ${response.status}`;
				return;
			}
			const survey: { id: string } = await response.json();
			await goto(`/admin/surveys/${survey.id}`);
		} finally {
			submitting = false;
		}
	}
</script>

<h1>Neue Umfrage</h1>
<form onsubmit={submit}>
	<label>
		Titel
		<input type="text" bind:value={title} />
	</label>
	<QuestionEditor bind:questions />
	<DimensionMapper {questions} bind:dimensions />
	{#if errorMessage}<p role="alert">{errorMessage}</p>{/if}
	<button type="submit" disabled={submitting}>Umfrage erstellen</button>
</form>

<style>
	form {
		display: grid;
		gap: var(--space-3);
	}
	label {
		display: grid;
		gap: 0.25rem;
	}
</style>
