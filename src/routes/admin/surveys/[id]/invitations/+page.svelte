<script lang="ts">
	import { page } from '$app/state';
	import { adminFetch } from '../../../../../lib/client/admin-session';

	const surveyId = page.params.id;
	let emailText = $state('');
	let message = $state('');
	let progress = $state<{ invited: number; responded: number } | null>(null);
	let sending = $state(false);

	async function loadProgress() {
		const response = await adminFetch(`/api/admin/surveys/${surveyId}/progress`);
		if (response.ok) progress = await response.json();
	}

	$effect(() => {
		loadProgress();
	});

	async function send(event: SubmitEvent) {
		event.preventDefault();
		const emails = emailText
			.split('\n')
			.map((line) => line.trim())
			.filter((line) => line !== '');
		if (emails.length === 0) {
			message = 'Keine E-Mail-Adressen angegeben.';
			return;
		}
		sending = true;
		try {
			const response = await adminFetch('/api/admin/invitations', {
				method: 'POST',
				body: JSON.stringify({ surveyId, emails })
			});
			if (!response.ok) {
				message = `Fehler ${response.status}`;
				return;
			}
			const created: unknown[] = await response.json();
			message = `${created.length} Einladungen erstellt.`;
			emailText = '';
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
		E-Mail-Adressen (eine pro Zeile)
		<textarea rows="10" bind:value={emailText}></textarea>
	</label>
	<button type="submit" disabled={sending}>Einladungen senden</button>
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
</style>
