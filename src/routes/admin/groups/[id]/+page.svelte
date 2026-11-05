<script lang="ts">
	import { page } from '$app/state';
	import { adminFetch } from '../../../../lib/client/admin-session';

	interface Member {
		id: string;
		name: string;
		email: string;
	}

	interface SurveyRef {
		id: string;
		title: string;
		status: string;
	}

	interface GroupDetail {
		id: string;
		name: string;
		createdAt: string;
		members: Member[];
		surveys: SurveyRef[];
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
	<main>
		<a href="/admin/groups" class="back">&larr; Alle Gruppen</a>
		<h1>{group.name}</h1>

		<section>
			<h2>Mitglieder ({group.members.length})</h2>
			{#if group.members.length === 0}
				<p class="empty">Noch keine Mitglieder.</p>
			{:else}
				<ul class="member-list">
					{#each group.members as member (member.id)}
						<li>
							<span class="member-info">
								<span class="member-name">{member.name || '(kein Name)'}</span>
								<span class="member-email">{member.email}</span>
							</span>
							<button
								type="button"
								onclick={() => removeMember(member.id)}
								class="remove-btn"
							>
								Entfernen
							</button>
						</li>
					{/each}
				</ul>
			{/if}

			<div class="add-member">
				<input type="text" bind:value={newMemberName} placeholder="Name" />
				<input type="email" bind:value={newMemberEmail} placeholder="E-Mail" />
				<button type="button" onclick={addMember} disabled={addingMember} class="add-btn">
					Hinzufügen
				</button>
			</div>
		</section>

		{#if group.surveys.length > 0}
			<section>
				<h2>Umfragen ({group.surveys.length})</h2>
				<ul class="survey-list">
					{#each group.surveys as survey (survey.id)}
						<li>
							<a href="/admin/surveys/{survey.id}" class="survey-link">
								<span class="survey-title">{survey.title}</span>
								<span class="status-badge" class:open={survey.status === 'open'} class:closed={survey.status === 'closed'}>
									{survey.status === 'open' ? 'Offen' : 'Abgeschlossen'}
								</span>
							</a>
						</li>
					{/each}
				</ul>
			</section>
		{/if}
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
		margin-bottom: var(--space-1);
	}
	h2 {
		font-size: var(--font-size-h5);
		margin-bottom: var(--space-2);
	}
	section {
		margin-top: var(--space-4);
	}
	.empty {
		color: var(--color-muted);
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
		border: 1px solid var(--color-border);
		border-radius: 8px;
	}
	.member-info {
		display: flex;
		flex-direction: column;
	}
	.member-name {
		font-weight: 600;
	}
	.member-email {
		font-size: var(--font-size-small);
		color: var(--color-muted);
	}
	.remove-btn {
		background: none;
		border: 1px solid var(--color-border);
		border-radius: 6px;
		padding: 4px 12px;
		cursor: pointer;
		font-size: var(--font-size-small);
		color: var(--color-muted);
		transition: border-color 0.15s, color 0.15s;
	}
	.remove-btn:hover {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}
	.add-member {
		display: flex;
		gap: var(--space-2);
		margin-top: var(--space-2);
	}
	.add-member input {
		flex: 1;
		padding: 8px 12px;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		font-size: inherit;
		font-family: inherit;
	}
	.add-btn {
		padding: 8px 16px;
		background: var(--color-primary);
		color: var(--color-bg);
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
	}
	.add-btn:disabled {
		opacity: 0.5;
	}
	.survey-list {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	.survey-list li {
		border: 1px solid var(--color-border);
		border-radius: 8px;
		transition: border-color 0.15s;
	}
	.survey-list li:hover {
		border-color: var(--color-primary);
	}
	.survey-link {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-2) var(--space-3);
		text-decoration: none;
	}
	.survey-title {
		font-weight: 600;
	}
	.status-badge {
		display: inline-block;
		padding: 2px 10px;
		border-radius: 100px;
		font-size: 12px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.status-badge.open {
		background: var(--color-success-bg);
		color: var(--color-success);
	}
	.status-badge.closed {
		background: var(--color-info-bg);
		color: var(--color-info);
	}
	@media (max-width: 600px) {
		.add-member {
			flex-direction: column;
		}
	}
</style>
