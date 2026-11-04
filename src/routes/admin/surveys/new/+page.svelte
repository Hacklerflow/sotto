<script lang="ts">
	import { goto } from '$app/navigation';
	import { adminFetch } from '../../../../lib/client/admin-session';
	import DimensionMapper from '../../../../lib/components/DimensionMapper.svelte';
	import QuestionEditor from '../../../../lib/components/QuestionEditor.svelte';
	import { validateSurveyConfig, type Dimension, type Question, type SurveyConfig } from '../../../../lib/types/survey';

	interface Group {
		id: string;
		name: string;
	}

	interface Invitation {
		email: string;
		token: string;
	}

	let title = $state('');
	let questions = $state<Question[]>([]);
	let dimensions = $state<Dimension[]>([]);
	let selectedGroupId = $state('');
	let groups = $state<Group[]>([]);
	let errorMessage = $state('');
	let submitting = $state(false);
	let createdInvitations = $state<Invitation[]>([]);
	let createdSurveyId = $state('');

	$effect(() => {
		adminFetch('/api/admin/groups')
			.then((response) => (response.ok ? response.json() : []))
			.then((data) => (groups = data));
	});

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
		const draft = {
			questions: cleanQuestions(),
			dimensions: $state.snapshot(dimensions),
			visualizations: $state.snapshot(dimensions).map((_, dimensionIndex) => ({ dimensionIndex }))
		};
		if (title.trim() === '') {
			errorMessage = 'Titel fehlt.';
			return;
		}
		if (!selectedGroupId) {
			errorMessage = 'Bitte eine Gruppe auswählen.';
			return;
		}
		let config: SurveyConfig;
		try {
			config = validateSurveyConfig(draft);
		} catch (cause) {
			errorMessage = cause instanceof Error ? cause.message : 'Ungültige Konfiguration.';
			return;
		}
		submitting = true;
		try {
			const surveyResponse = await adminFetch('/api/admin/surveys', {
				method: 'POST',
				body: JSON.stringify({ title: title.trim(), config })
			});
			if (!surveyResponse.ok) {
				errorMessage =
					surveyResponse.status === 401
						? 'Admin-Secret ungültig. Bitte abmelden und neu eingeben.'
						: `Fehler ${surveyResponse.status}`;
				return;
			}
			const survey: { id: string } = await surveyResponse.json();
			createdSurveyId = survey.id;

			const inviteResponse = await adminFetch('/api/admin/invitations', {
				method: 'POST',
				body: JSON.stringify({ surveyId: survey.id, groupId: selectedGroupId })
			});
			if (inviteResponse.ok) {
				createdInvitations = await inviteResponse.json();
			}
		} finally {
			submitting = false;
		}
	}

	function invitationUrl(token: string): string {
		return `${window.location.origin}/invite/${token}`;
	}

	async function copyAllLinks() {
		const text = createdInvitations
			.map((invitation) => `${invitation.email}: ${invitationUrl(invitation.token)}`)
			.join('\n');
		await navigator.clipboard.writeText(text);
	}
</script>

{#if createdInvitations.length > 0}
	<h1>Umfrage erstellt</h1>
	<p>{createdInvitations.length} Einladungen verschickt. Teile diese Links mit den Teilnehmern:</p>
	<ul class="invitation-list">
		{#each createdInvitations as invitation}
			<li>
				<strong>{invitation.email}</strong>
				<code>{invitationUrl(invitation.token)}</code>
			</li>
		{/each}
	</ul>
	<div class="actions">
		<button type="button" onclick={copyAllLinks}>Alle Links kopieren</button>
		<a href="/admin/surveys/{createdSurveyId}">Zur Umfrage</a>
	</div>
{:else}
	<h1>Neue Umfrage</h1>
	<form onsubmit={submit}>
		<label>
			Titel
			<input type="text" bind:value={title} />
		</label>

		<label>
			Gruppe
			<select bind:value={selectedGroupId}>
				<option value="">— Gruppe wählen —</option>
				{#each groups as group (group.id)}
					<option value={group.id}>{group.name}</option>
				{/each}
			</select>
		</label>
		{#if groups.length === 0}
			<p class="hint">
				Noch keine Gruppen vorhanden.
				<a href="/admin/groups/new">Zuerst eine Gruppe erstellen</a>
			</p>
		{/if}

		<QuestionEditor bind:questions />
		<DimensionMapper {questions} bind:dimensions />
		{#if errorMessage}<p role="alert">{errorMessage}</p>{/if}
		<button type="submit" disabled={submitting}>Umfrage erstellen & einladen</button>
	</form>
{/if}

<style>
	form {
		display: grid;
		gap: var(--space-3);
	}
	label {
		display: grid;
		gap: 0.25rem;
	}
	select {
		padding: var(--space-1) var(--space-2);
		border: 2px solid var(--color-primary);
		border-radius: 8px;
		font-size: inherit;
	}
	.hint {
		font-size: var(--font-size-small);
		opacity: 0.7;
	}
	.invitation-list {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.invitation-list li {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-primary);
		border-radius: 8px;
	}
	.invitation-list code {
		font-size: var(--font-size-small);
		word-break: break-all;
	}
	.actions {
		display: flex;
		gap: var(--space-2);
		margin-top: var(--space-2);
	}
	.actions a {
		padding: var(--space-2) var(--space-3);
		border: 2px solid var(--color-primary);
		border-radius: 12px;
		font-weight: 600;
		text-decoration: none;
	}
</style>
