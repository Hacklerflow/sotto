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
	let message = $state('');
	let progress = $state<{ invited: number; responded: number } | null>(null);
	let sending = $state(false);

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
			const created: unknown[] = await response.json();
			message = `${created.length} Einladungen erstellt.`;
			selectedGroupId = '';
			await loadProgress();
		} finally {
			sending = false;
		}
	}
</script>

<h1>Einladungen</h1>
{#if progress}
	<p>{progress.invited} eingeladen, {progress.responded} Antworten eingegangen.</p>
{/if}

<form onsubmit={send}>
	<label>
		Gruppe auswählen
		<select bind:value={selectedGroupId}>
			<option value="">— Gruppe wählen —</option>
			{#each groups as group (group.id)}
				<option value={group.id}>{group.name}</option>
			{/each}
		</select>
	</label>
	{#if groups.length === 0}
		<p>
			Noch keine Gruppen vorhanden.
			<a href="/admin/groups/new">Gruppe erstellen</a>
		</p>
	{/if}
	<button type="submit" disabled={sending || !selectedGroupId}>Einladungen senden</button>
</form>
{#if message}<p role="status">{message}</p>{/if}

<style>
	form {
		display: grid;
		gap: var(--space-2);
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
</style>
