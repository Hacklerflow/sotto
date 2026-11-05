<script lang="ts">
	import { loadCredential, requestBlindSignature, submitAnonymous } from '../client/blind-requester';
	import type { BlindCredential } from '../client/blind-requester';

	let {
		surveyId,
		answers
	}: { surveyId: string; answers: Record<string, unknown> } = $props();

	type Phase = 'anonymizing' | 'submitting' | 'done' | 'error';

	let phase = $state<Phase>('anonymizing');
	let errorMessage = $state('');
	// Kept in memory so a retry never asks the server for a second signature.
	let credential: BlindCredential | null = null;

	const messages: Record<Phase, string> = {
		anonymizing: 'Anonymisierung läuft …',
		submitting: 'Antwort wird übermittelt …',
		done: 'Erfolgreich abgegeben.',
		error: 'Das Absenden ist fehlgeschlagen.'
	};

	async function run(): Promise<void> {
		errorMessage = '';
		try {
			if (!credential) {
				phase = 'anonymizing';
				credential = loadCredential(surveyId) ?? (await requestBlindSignature(surveyId));
			}
			phase = 'submitting';
			await submitAnonymous(surveyId, credential.signature, credential.message, answers);
			phase = 'done';
		} catch (cause) {
			phase = 'error';
			errorMessage = cause instanceof Error ? cause.message : 'Unbekannter Fehler';
		}
	}

	$effect(() => {
		void run();
	});
</script>

<div class="flow" role="status" aria-live="polite">
	{#if phase === 'anonymizing' || phase === 'submitting'}
		<div class="spinner" aria-hidden="true"></div>
		<p class="message">{messages[phase]}</p>
		{#if phase === 'submitting'}
			<p class="hint">
				Die Übermittlung wird zufällig um bis zu 30 Sekunden verzögert, damit sie sich nicht deiner
				Anmeldung zuordnen lässt. Bitte lass diese Seite offen.
			</p>
		{/if}
	{:else if phase === 'done'}
		<div class="done-icon" aria-hidden="true">&#10003;</div>
		<p class="message">{messages[phase]}</p>
		<p class="done-sub">Danke für deine Teilnahme.</p>
		<a href="/survey/{surveyId}/results" class="results-link">Ergebnisse ansehen</a>
	{:else if phase === 'error'}
		<div class="error-icon" aria-hidden="true">!</div>
		<p class="message">{messages[phase]}</p>
		<p class="hint error-hint">{errorMessage}</p>
		<button type="button" onclick={() => void run()}>Erneut versuchen</button>
	{/if}
</div>

<style>
	.flow {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-2);
		text-align: center;
		min-height: 60dvh;
		justify-content: center;
		padding: var(--space-3) var(--space-2);
	}
	.spinner {
		width: 48px;
		height: 48px;
		border: 3px solid #e0e0e0;
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	.message {
		font-size: var(--font-size-h4);
		font-weight: 700;
		margin: 0;
	}
	.hint {
		font-size: var(--font-size-small);
		color: var(--color-muted);
		margin: 0;
		max-width: 28rem;
		line-height: 1.6;
	}
	.error-hint {
		color: var(--color-accent);
	}
	.done-icon {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background: var(--color-primary);
		color: var(--color-bg);
		font-size: 2rem;
		font-weight: 900;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.done-sub {
		color: var(--color-muted);
		margin: 0;
	}
	.error-icon {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background: var(--color-accent);
		color: var(--color-bg);
		font-size: 2rem;
		font-weight: 900;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.results-link {
		display: inline-flex;
		align-items: center;
		min-height: 48px;
		padding: 0 24px;
		margin-top: var(--space-2);
		background: var(--color-primary);
		color: var(--color-bg);
		border-radius: 8px;
		font-weight: 700;
		text-decoration: none;
		transition: opacity 0.15s;
	}
	.results-link:hover {
		opacity: 0.85;
	}
	button {
		min-height: 48px;
		padding: 0 24px;
		font-size: var(--font-size-body);
		font-weight: 700;
		border-radius: 8px;
		border: 1px solid #e0e0e0;
		background: transparent;
		color: var(--color-primary);
		cursor: pointer;
		transition: border-color 0.15s;
	}
	button:hover {
		border-color: var(--color-primary);
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.spinner {
			animation-duration: 3s;
		}
	}
</style>
