<script lang="ts">
	import { adminFetch } from '../../../lib/client/admin-session';

	interface Group {
		id: string;
		name: string;
		createdAt: string;
		memberCount?: number;
	}

	let groups = $state<Group[]>([]);
	let loading = $state(true);

	$effect(() => {
		adminFetch('/api/admin/groups')
			.then((response) => (response.ok ? response.json() : []))
			.then((data) => {
				groups = data;
				loading = false;
			});
	});
</script>

<h1>Gruppen</h1>

{#if loading}
	<p>Laden …</p>
{:else if groups.length === 0}
	<p>Noch keine Gruppen angelegt. <a href="/admin/groups/new">Jetzt eine erstellen</a></p>
{:else}
	<a href="/admin/groups/new" class="create-btn">+ Neue Gruppe</a>
	<ul class="group-list">
		{#each groups as group (group.id)}
			<li>
				<a href="/admin/groups/{group.id}" class="group-link">
					<span class="group-name">{group.name}</span>
					{#if group.memberCount != null}
						<span class="group-meta">{group.memberCount} Mitglieder</span>
					{/if}
				</a>
			</li>
		{/each}
	</ul>
{/if}

<style>
	h1 {
		font-size: var(--font-size-h3);
		margin-bottom: var(--space-3);
	}
	.create-btn {
		display: inline-block;
		margin-bottom: var(--space-3);
		padding: 10px 20px;
		background: var(--color-primary);
		color: var(--color-bg);
		border-radius: 8px;
		font-weight: 700;
		font-size: var(--font-size-small);
		text-decoration: none;
	}
	.group-list {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
	}
	.group-list li {
		border: 1px solid var(--color-border);
		border-radius: 12px;
		transition: border-color 0.15s;
	}
	.group-list li:hover {
		border-color: var(--color-primary);
	}
	.group-link {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-2) var(--space-3);
		text-decoration: none;
	}
	.group-name {
		font-weight: 700;
		font-size: var(--font-size-h5);
	}
	.group-meta {
		font-size: var(--font-size-small);
		color: var(--color-muted);
	}
</style>
