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
		done: 'Erfolgreich abgegeben. Danke für deine Teilnahme.',
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
	{/if}
	<p class="message" data-phase={phase}>{messages[phase]}</p>
	{#if phase === 'submitting'}
		<p class="hint">
			Die Übermittlung wird zufällig um bis zu 30 Sekunden verzögert, damit sie sich nicht deiner
			Anmeldung zuordnen lässt. Bitte lass diese Seite offen.
		</p>
	{/if}
	{#if phase === 'error'}
		<p class="hint">{errorMessage}</p>
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
	}
	.spinner {
		width: 48px;
		height: 48px;
		border: 5px solid #e5e5ea;
		border-top-color: var(--color-accent);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	.message {
		font-size: var(--font-size-h5);
		font-weight: 600;
		margin: 0;
	}
	.hint {
		font-size: var(--font-size-small);
		margin: 0;
	}
	button {
		min-height: 48px;
		padding: 0 var(--space-3);
		font-size: var(--font-size-body);
		font-weight: 600;
		border-radius: 12px;
		border: 2px solid var(--color-primary);
		background: var(--color-primary);
		color: var(--color-bg);
		cursor: pointer;
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
