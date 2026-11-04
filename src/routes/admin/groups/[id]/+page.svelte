<script lang="ts">
	import { page } from '$app/state';
	import { adminFetch } from '../../../../lib/client/admin-session';

	interface Member {
		id: string;
		name: string;
		email: string;
	}

	interface GroupDetail {
		id: string;
		name: string;
		createdAt: string;
		members: Member[];
	}

	let group = $state<GroupDetail | null>(null);
	let loading = $state(true);
	let newMemberName = $state('');
	let newMemberEmail = $state('');
	let addingMember = $state(false);

	$effect(() => {
		const groupId = page.params.id;
		adminFetch(`/api/admin/groups/${groupId}`)
			.then((response) => (response.ok ? response.json() : null))
			.then((data) => {
				group = data;
				loading = false;
			});
	});

	async function addMember() {
		if (!group || newMemberEmail.trim() === '') return;
		addingMember = true;
		try {
			const response = await adminFetch(`/api/admin/groups/${group.id}/members`, {
				method: 'POST',
				body: JSON.stringify([
					{ name: newMemberName.trim(), email: newMemberEmail.trim() }
				])
			});
			if (response.ok) {
				const added: Member[] = await response.json();
				group = { ...group, members: [...group.members, ...added] };
				newMemberName = '';
				newMemberEmail = '';
			}
		} finally {
			addingMember = false;
		}
	}

	async function removeMember(memberId: string) {
		if (!group) return;
		const response = await adminFetch(
			`/api/admin/groups/${group.id}/members?memberId=${memberId}`,
			{ method: 'DELETE' }
		);
		if (response.ok) {
			group = { ...group, members: group.members.filter((member) => member.id !== memberId) };
		}
	}
</script>

{#if loading}
	<p>Laden …</p>
{:else if !group}
	<p>Gruppe nicht gefunden.</p>
{:else}
	<h1>{group.name}</h1>

	<section>
		<h2>Mitglieder ({group.members.length})</h2>
		{#if group.members.length === 0}
			<p>Noch keine Mitglieder.</p>
		{:else}
			<ul class="member-list">
				{#each group.members as member (member.id)}
					<li>
						<span class="member-info">
							<strong>{member.name || '(kein Name)'}</strong>
							<span class="email">{member.email}</span>
						</span>
						<button
							type="button"
							onclick={() => removeMember(member.id)}
							class="remove-button"
						>
							Entfernen
						</button>
					</li>
				{/each}
			</ul>
		{/if}

		<div class="add-member-form">
			<input type="text" bind:value={newMemberName} placeholder="Name" />
			<input type="email" bind:value={newMemberEmail} placeholder="E-Mail" />
			<button type="button" onclick={addMember} disabled={addingMember}>Hinzufügen</button>
		</div>
	</section>
{/if}

<style>
	section {
		margin-top: var(--space-3);
	}
	.member-list {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	.member-list li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-primary);
		border-radius: 8px;
	}
	.member-info {
		display: flex;
		flex-direction: column;
	}
	.email {
		font-size: var(--font-size-small);
		opacity: 0.7;
	}
	.remove-button {
		background: none;
		border: 1px solid currentColor;
		border-radius: 6px;
		padding: 0.25rem 0.75rem;
		cursor: pointer;
		font-size: var(--font-size-small);
	}
	.add-member-form {
		display: flex;
		gap: var(--space-2);
		margin-top: var(--space-2);
	}
	.add-member-form input {
		flex: 1;
	}
</style>
