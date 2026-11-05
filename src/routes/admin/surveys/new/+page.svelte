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
	let copied = $state(false);

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
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

{#if createdInvitations.length > 0}
	<main>
		<h1>Umfrage erstellt</h1>
		<p class="success-text">{createdInvitations.length} Einladungen erstellt. Teile diese Links mit den Teilnehmern:</p>

		<div class="results-header">
			<h2>Einladungs-Links</h2>
			<button type="button" class="copy-btn" onclick={copyAllLinks}>
				{copied ? 'Kopiert!' : 'Alle Links kopieren'}
			</button>
		</div>
		<ul class="invitation-list">
			{#each createdInvitations as invitation}
				<li>
					<span class="inv-email">{invitation.email}</span>
					<code class="inv-link">{invitationUrl(invitation.token)}</code>
				</li>
			{/each}
		</ul>
		<div class="actions">
			<a href="/admin/surveys/{createdSurveyId}" class="primary-link">Zur Umfrage</a>
		</div>
	</main>
{:else}
	<main>
		<a href="/admin/surveys" class="back">&larr; Alle Umfragen</a>

		<h1>Neue Umfrage</h1>

		<form onsubmit={submit}>
			<label>
				<span class="label-text">Titel</span>
				<input type="text" bind:value={title} placeholder="z.B. Teamzufriedenheit Q4" />
			</label>

			<label>
				<span class="label-text">Gruppe</span>
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

			{#if errorMessage}<p class="error" role="alert">{errorMessage}</p>{/if}
			<button type="submit" class="submit-btn" disabled={submitting}>
				{submitting ? 'Wird erstellt …' : 'Umfrage erstellen & einladen'}
			</button>
		</form>
	</main>
{/if}

<style>
	main {
		max-width: 64rem;
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
	h1 {
		font-size: var(--font-size-h3);
		margin-bottom: var(--space-3);
	}
	h2 {
		font-size: var(--font-size-h5);
		margin: 0;
	}
	form {
		display: grid;
		gap: var(--space-3);
	}
	label {
		display: grid;
		gap: 4px;
	}
	.label-text {
		font-size: var(--font-size-small);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-muted);
	}
	input[type='text'] {
		padding: 10px 12px;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		font-size: inherit;
		font-family: inherit;
	}
	input:focus {
		outline: 2px solid var(--color-primary);
		outline-offset: 1px;
	}
	select {
		padding: 10px 12px;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		font-size: inherit;
		font-family: inherit;
	}
	select:focus {
		outline: 2px solid var(--color-primary);
		outline-offset: 1px;
	}
	.hint {
		font-size: var(--font-size-small);
		color: var(--color-muted);
	}
	.error {
		color: var(--color-accent);
		font-weight: 600;
	}
	.submit-btn {
		justify-self: start;
		padding: 12px 28px;
		background: var(--color-primary);
		color: var(--color-bg);
		border: none;
		border-radius: 8px;
		font-weight: 700;
		font-size: inherit;
		cursor: pointer;
	}
	.submit-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.success-text {
		color: var(--color-muted);
		margin-bottom: var(--space-3);
	}
	.results-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-2);
	}
	.copy-btn {
		padding: 6px 16px;
		border: 1px solid #e0e0e0;
		border-radius: 6px;
		background: transparent;
		font-size: var(--font-size-small);
		font-weight: 600;
		cursor: pointer;
		transition: border-color 0.15s;
	}
	.copy-btn:hover {
		border-color: var(--color-primary);
	}
	.invitation-list {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	.invitation-list li {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: var(--space-2) var(--space-3);
		border: 1px solid #e0e0e0;
		border-radius: 8px;
	}
	.inv-email {
		font-weight: 600;
	}
	.inv-link {
		font-size: var(--font-size-small);
		color: var(--color-muted);
		word-break: break-all;
	}
	.actions {
		margin-top: var(--space-3);
	}
	.primary-link {
		display: inline-block;
		padding: 10px 24px;
		background: var(--color-primary);
		color: var(--color-bg);
		border-radius: 8px;
		font-weight: 700;
		text-decoration: none;
	}
	.primary-link:hover {
		opacity: 0.85;
	}
</style>
