<script lang="ts">
	import { adminFetch } from '../../lib/client/admin-session';
	import type { Survey } from '../../lib/types/survey';

	let surveys = $state<Survey[]>([]);
	let loading = $state(true);
	let error = $state(false);

	$effect(() => {
		adminFetch('/api/admin/surveys')
			.then((response) => {
				if (!response.ok) throw new Error();
				return response.json();
			})
			.then((data: Survey[]) => {
				surveys = data;
			})
			.catch(() => {
				error = true;
			})
			.finally(() => {
				loading = false;
			});
	});

	const openCount = $derived(surveys.filter((s) => s.status === 'open').length);
	const closedCount = $derived(surveys.filter((s) => s.status === 'closed').length);
</script>

<h1>Dashboard</h1>

{#if loading}
	<p class="loading">Laden …</p>
{:else if error}
	<p class="error">Daten konnten nicht geladen werden.</p>
{:else}
	<div class="stats">
		<div class="stat-card">
			<span class="stat-value">{surveys.length}</span>
			<span class="stat-label">Umfragen</span>
		</div>
		<div class="stat-card">
			<span class="stat-value">{openCount}</span>
			<span class="stat-label">Offen</span>
		</div>
		<div class="stat-card">
			<span class="stat-value">{closedCount}</span>
			<span class="stat-label">Abgeschlossen</span>
		</div>
	</div>
{/if}

<nav class="quick-actions">
	<a href="/admin/surveys/new" class="action-card primary">
		<span class="action-icon">+</span>
		<span class="action-text">Neue Umfrage erstellen</span>
	</a>
	<a href="/admin/surveys" class="action-card">
		<span class="action-text">Alle Umfragen</span>
	</a>
	<a href="/admin/groups" class="action-card">
		<span class="action-text">Gruppen verwalten</span>
	</a>
</nav>

<style>
	h1 {
		font-size: var(--font-size-h3);
		margin-bottom: var(--space-3);
	}
	.stats {
		display: flex;
		gap: var(--space-2);
		margin-bottom: var(--space-4);
	}
	.stat-card {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: 12px;
	}
	.stat-value {
		font-size: var(--font-size-h2);
		font-weight: 900;
		line-height: 1;
	}
	.stat-label {
		font-size: var(--font-size-small);
		color: var(--color-muted);
		margin-top: 4px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 700;
	}
	.quick-actions {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--space-2);
	}
	.action-card {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		padding: var(--space-2) var(--space-3);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		text-decoration: none;
		font-weight: 600;
		transition: border-color 0.15s;
	}
	.action-card:hover {
		border-color: var(--color-primary);
	}
	.action-card.primary {
		background: var(--color-primary);
		color: var(--color-bg);
		border-color: var(--color-primary);
	}
	.action-icon {
		font-size: 24px;
		font-weight: 300;
	}
	.loading {
		color: var(--color-muted);
	}
	.error {
		color: var(--color-accent);
		font-weight: 600;
	}
	@media (max-width: 600px) {
		.stats {
			flex-direction: column;
		}
	}
</style>
