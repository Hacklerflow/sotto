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

<h1>Neue Gruppe</h1>

<form onsubmit={submit}>
	<label>
		Gruppenname
		<input type="text" bind:value={name} placeholder="z.B. Team Engineering" />
	</label>

	<fieldset>
		<legend>Mitglieder</legend>
		{#each memberRows as row, index}
			<div class="member-row">
				<input type="text" bind:value={row.name} placeholder="Name" />
				<input type="email" bind:value={row.email} placeholder="E-Mail" />
				{#if memberRows.length > 1}
					<button type="button" onclick={() => removeRow(index)} class="remove-button">
						&times;
					</button>
				{/if}
			</div>
		{/each}
		<button type="button" onclick={addRow} class="add-button">+ Mitglied hinzufügen</button>
	</fieldset>

	{#if errorMessage}<p role="alert">{errorMessage}</p>{/if}
	<button type="submit" disabled={submitting}>Gruppe erstellen</button>
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
	fieldset {
		border: 2px solid var(--color-primary);
		border-radius: 12px;
		padding: var(--space-3);
		display: grid;
		gap: var(--space-2);
	}
	legend {
		font-weight: 600;
	}
	.member-row {
		display: flex;
		gap: var(--space-2);
		align-items: center;
	}
	.member-row input {
		flex: 1;
	}
	.remove-button {
		background: none;
		border: none;
		font-size: 1.2rem;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
	}
	.add-button {
		justify-self: start;
		background: none;
		border: 1px dashed var(--color-primary);
		border-radius: 8px;
		padding: var(--space-1) var(--space-2);
		cursor: pointer;
	}
</style>
