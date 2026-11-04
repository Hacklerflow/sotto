<script lang="ts">
	import { adminFetch } from '../../../lib/client/admin-session';

	interface Group {
		id: string;
		name: string;
		createdAt: string;
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

<a href="/admin/groups/new" class="create-link">Neue Gruppe erstellen</a>

{#if loading}
	<p>Laden …</p>
{:else if groups.length === 0}
	<p>Noch keine Gruppen angelegt.</p>
{:else}
	<ul class="group-list">
		{#each groups as group (group.id)}
			<li>
				<a href="/admin/groups/{group.id}">{group.name}</a>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.create-link {
		display: inline-block;
		margin-bottom: var(--space-3);
		padding: var(--space-2) var(--space-3);
		border: 2px solid var(--color-primary);
		border-radius: 12px;
		font-weight: 600;
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
		padding: var(--space-2) var(--space-3);
		border: 2px solid var(--color-primary);
		border-radius: 12px;
	}
	.group-list a {
		font-weight: 600;
		font-size: var(--font-size-h5);
	}
</style>
