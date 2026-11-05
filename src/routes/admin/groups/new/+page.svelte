<script lang="ts">
	import { goto } from '$app/navigation';
	import { adminFetch } from '../../../../lib/client/admin-session';

	let name = $state('');
	let memberRows = $state([{ name: '', email: '' }]);
	let errorMessage = $state('');
	let submitting = $state(false);

	function addRow() {
		memberRows = [...memberRows, { name: '', email: '' }];
	}

	function removeRow(index: number) {
		memberRows = memberRows.filter((_, i) => i !== index);
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		errorMessage = '';
		if (name.trim() === '') {
			errorMessage = 'Gruppenname fehlt.';
			return;
		}
		const members = memberRows.filter((row) => row.email.trim() !== '');
		if (members.length === 0) {
			errorMessage = 'Mindestens ein Mitglied mit E-Mail angeben.';
			return;
		}
		submitting = true;
		try {
			const response = await adminFetch('/api/admin/groups', {
				method: 'POST',
				body: JSON.stringify({
					name: name.trim(),
					members: members.map((member) => ({
						name: member.name.trim(),
						email: member.email.trim()
					}))
				})
			});
			if (!response.ok) {
				errorMessage = `Fehler ${response.status}`;
				return;
			}
			const group: { id: string } = await response.json();
			await goto(`/admin/groups/${group.id}`);
		} finally {
			submitting = false;
		}
	}
</script>

<main>
	<a href="/admin/groups" class="back">&larr; Alle Gruppen</a>

	<h1>Neue Gruppe</h1>

	<form onsubmit={submit}>
		<label>
			<span class="label-text">Gruppenname</span>
			<input type="text" bind:value={name} placeholder="z.B. Team Engineering" />
		</label>

		<section class="members-section">
			<h2>Mitglieder</h2>
			{#each memberRows as row, index}
				<div class="member-row">
					<input type="text" bind:value={row.name} placeholder="Name" />
					<input type="email" bind:value={row.email} placeholder="E-Mail" />
					{#if memberRows.length > 1}
						<button type="button" onclick={() => removeRow(index)} class="remove-btn">
							&times;
						</button>
					{/if}
				</div>
			{/each}
			<button type="button" onclick={addRow} class="add-btn">+ Mitglied hinzufügen</button>
		</section>

		{#if errorMessage}<p class="error" role="alert">{errorMessage}</p>{/if}
		<button type="submit" class="submit-btn" disabled={submitting}>
			{submitting ? 'Wird erstellt …' : 'Gruppe erstellen'}
		</button>
	</form>
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
		margin-bottom: var(--space-3);
	}
	h2 {
		font-size: var(--font-size-h5);
		margin: 0 0 var(--space-2);
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
	input[type='text'],
	input[type='email'] {
		padding: 10px 12px;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		font-size: inherit;
		font-family: inherit;
	}
	input:focus {
		outline: 2px solid var(--color-primary);
		outline-offset: 1px;
	}
	.members-section {
		border: 1px solid var(--color-border);
		border-radius: 12px;
		padding: var(--space-3);
		display: grid;
		gap: var(--space-2);
	}
	.member-row {
		display: flex;
		gap: var(--space-2);
		align-items: center;
	}
	.member-row input {
		flex: 1;
	}
	.remove-btn {
		background: none;
		border: 1px solid var(--color-border);
		border-radius: 6px;
		font-size: 1.2rem;
		cursor: pointer;
		padding: 4px 10px;
		color: var(--color-muted);
		transition: border-color 0.15s, color 0.15s;
	}
	.remove-btn:hover {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}
	.add-btn {
		justify-self: start;
		background: none;
		border: 1px dashed var(--color-border);
		border-radius: 8px;
		padding: 8px 16px;
		cursor: pointer;
		font-size: var(--font-size-small);
		color: var(--color-muted);
		transition: border-color 0.15s, color 0.15s;
	}
	.add-btn:hover {
		border-color: var(--color-primary);
		color: var(--color-primary);
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
	@media (max-width: 600px) {
		.member-row {
			flex-direction: column;
		}
	}
</style>
