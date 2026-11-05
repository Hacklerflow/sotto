<script lang="ts">
	import type { Question } from '../types/survey';

	export type AnswerValue = number | string | string[] | null;

	let {
		question,
		value = $bindable()
	}: { question: Question; value: AnswerValue } = $props();

	const legendId = $derived(`legend-${question.id}`);
	const rangeValue = $derived(typeof value === 'number' ? value : null);

	$effect(() => {
		if (question.type === 'range' && question.range && value === null) {
			value = Math.round((question.range.min + question.range.max) / 2);
		}
	});

	function toggleOption(option: string, checked: boolean): void {
		const current = Array.isArray(value) ? value : [];
		const next = checked ? [...current, option] : current.filter((entry) => entry !== option);
		value = next.length > 0 ? next : null;
	}

	function parseNumber(raw: string): void {
		const parsed = Number(raw);
		value = raw.trim() === '' || !Number.isFinite(parsed) ? null : parsed;
	}
</script>

<fieldset class="question">
	<legend id={legendId}>{question.text}</legend>

	{#if question.type === 'number'}
		<label class="number-field">
			<span class="visually-hidden">{question.text}</span>
			<input
				type="number"
				inputmode="decimal"
				value={typeof value === 'number' ? value : ''}
				oninput={(event) => parseNumber(event.currentTarget.value)}
			/>
			{#if question.unit}<span class="unit">{question.unit}</span>{/if}
		</label>
	{:else if question.type === 'single-choice'}
		{#each question.options ?? [] as option (option)}
			<label class="choice">
				<input
					type="radio"
					name={question.id}
					value={option}
					checked={value === option}
					onchange={() => (value = option)}
				/>
				<span>{option}</span>
			</label>
		{/each}
	{:else if question.type === 'multi-choice'}
		{#each question.options ?? [] as option (option)}
			<label class="choice">
				<input
					type="checkbox"
					value={option}
					checked={Array.isArray(value) && value.includes(option)}
					onchange={(event) => toggleOption(option, event.currentTarget.checked)}
				/>
				<span>{option}</span>
			</label>
		{/each}
	{:else if question.type === 'range' && question.range}
		<div class="range-field">
			<output class="range-value">{rangeValue ?? '–'}</output>
			<input
				type="range"
				aria-labelledby={legendId}
				min={question.range.min}
				max={question.range.max}
				step="1"
				value={rangeValue ?? Math.round((question.range.min + question.range.max) / 2)}
				oninput={(event) => (value = Number(event.currentTarget.value))}
				onchange={(event) => (value = Number(event.currentTarget.value))}
			/>
			<div class="range-bounds">
				<span>{question.range.min}</span>
				<span>{question.range.max}</span>
			</div>
		</div>
	{/if}
</fieldset>

<style>
	.question {
		border: 0;
		margin: 0;
		padding: 0;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	legend {
		font-size: var(--font-size-h5);
		font-weight: 600;
		padding: 0;
		margin-bottom: var(--space-2);
	}
	.choice {
		display: flex;
		align-items: center;
		gap: var(--space-2);
		min-height: 48px;
		padding: 0.5rem var(--space-2);
		border: 1px solid #e0e0e0;
		border-radius: 12px;
		font-size: var(--font-size-body);
		cursor: pointer;
		transition: border-color 0.15s, background 0.15s, color 0.15s;
	}
	.choice:hover {
		border-color: var(--color-primary);
	}
	.choice:has(input:checked) {
		background: var(--color-primary);
		border-color: var(--color-primary);
		color: var(--color-bg);
	}
	.choice input {
		width: 20px;
		height: 20px;
		flex-shrink: 0;
	}
	.number-field {
		display: flex;
		align-items: center;
		gap: var(--space-1);
	}
	.number-field input {
		flex: 1;
		min-height: 48px;
		font-size: var(--font-size-h5);
		padding: 0 var(--space-2);
		border: 1px solid #e0e0e0;
		border-radius: 12px;
		min-width: 0;
	}
	.number-field input:focus {
		outline: 2px solid var(--color-primary);
		outline-offset: 1px;
	}
	.unit {
		font-size: var(--font-size-body);
		color: var(--color-muted);
	}
	.range-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-1);
	}
	.range-value {
		font-size: var(--font-size-h4);
		font-weight: 700;
		text-align: center;
	}
	.range-field input[type='range'] {
		width: 100%;
		min-height: 48px;
		accent-color: var(--color-primary);
	}
	.range-bounds {
		display: flex;
		justify-content: space-between;
		font-size: var(--font-size-small);
		color: var(--color-muted);
	}
	.visually-hidden {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
