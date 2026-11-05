<script lang="ts">
	import { page } from '$app/state';
	import { adminFetch } from '../../../../../lib/client/admin-session';

	interface Group {
		id: string;
		name: string;
	}

	const surveyId = page.params.id;
	let groups = $state<Group[]>([]);
	let selectedGroupId = $state('');
	interface Invitation {
		email: string;
		token: string;
	}

	let message = $state('');
	let progress = $state<{ invited: number; responded: number } | null>(null);
	let sending = $state(false);
	let lastCreated = $state<Invitation[]>([]);
	let copied = $state(false);

	async function loadProgress() {
		const response = await adminFetch(`/api/admin/surveys/${surveyId}/progress`);
		if (response.ok) progress = await response.json();
	}

	$effect(() => {
		loadProgress();
		adminFetch('/api/admin/groups')
			.then((response) => (response.ok ? response.json() : []))
			.then((data) => (groups = data));
	});

	async function send(event: SubmitEvent) {
		event.preventDefault();
		if (!selectedGroupId) {
			message = 'Bitte eine Gruppe auswählen.';
			return;
		}
		sending = true;
		try {
			const response = await adminFetch('/api/admin/invitations', {
				method: 'POST',
				body: JSON.stringify({ surveyId, groupId: selectedGroupId })
			});
			if (!response.ok) {
				const errorText = await response.text().catch(() => '');
				message = `Fehler ${response.status}: ${errorText}`;
				return;
			}
			const created: Invitation[] = await response.json();
			lastCreated = created;
			message = `${created.length} Einladungen erstellt.`;
			selectedGroupId = '';
			await loadProgress();
		} finally {
			sending = false;
		}
	}

	function invitationUrl(token: string): string {
		return `${window.location.origin}/invite/${token}`;
	}

	async function copyAllLinks() {
		const text = lastCreated
			.map((invitation) => `${invitation.email}: ${invitationUrl(invitation.token)}`)
			.join('\n');
		await navigator.clipboard.writeText(text);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

<main>
	<a href="/admin/surveys/{surveyId}" class="back">&larr; Zur Umfrage</a>

	<h1>Einladungen</h1>

	{#if progress}
		<div class="progress-info">
			<span class="progress-count">{progress.invited} eingeladen</span>
			<span class="progress-divider">&middot;</span>
			<span class="progress-count">{progress.responded} Antworten</span>
		</div>
	{/if}

	<form onsubmit={send}>
		<label>
			<span class="label-text">Gruppe auswählen</span>
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
				<a href="/admin/groups/new">Gruppe erstellen</a>
			</p>
		{/if}
		<button type="submit" class="send-btn" disabled={sending || !selectedGroupId}>
			{sending ? 'Wird gesendet …' : 'Einladungen erstellen'}
		</button>
	</form>

	{#if message}<p class="message" role="status">{message}</p>{/if}

	{#if lastCreated.length > 0}
		<section class="results">
			<div class="results-header">
				<h2>Erstellte Einladungen</h2>
				<button type="button" class="copy-btn" onclick={copyAllLinks}>
					{copied ? 'Kopiert!' : 'Alle Links kopieren'}
				</button>
			</div>
			<ul class="invitation-list">
				{#each lastCreated as invitation}
					<li>
						<span class="inv-email">{invitation.email}</span>
						<code class="inv-link">{invitationUrl(invitation.token)}</code>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</main>

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
		margin-bottom: var(--space-1);
	}
	h2 {
		font-size: var(--font-size-h5);
		margin: 0;
	}
	.progress-info {
		display: flex;
		gap: 8px;
		font-size: var(--font-size-small);
		color: var(--color-muted);
		margin-bottom: var(--space-3);
	}
	form {
		display: grid;
		gap: var(--space-2);
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
	select {
		padding: 10px 12px;
		border: 1px solid var(--color-border);
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
	.send-btn {
		justify-self: start;
		padding: 10px 24px;
		background: var(--color-primary);
		color: var(--color-bg);
		border: none;
		border-radius: 8px;
		font-weight: 700;
		cursor: pointer;
	}
	.send-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.message {
		font-weight: 600;
		margin-top: var(--space-2);
	}
	.results {
		margin-top: var(--space-4);
	}
	.results-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: var(--space-2);
	}
	.copy-btn {
		padding: 6px 16px;
		border: 1px solid var(--color-border);
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
		border: 1px solid var(--color-border);
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
</style>
