<script lang="ts">
	import type { Question, QuestionType } from '../types/survey';

	let { questions = $bindable() }: { questions: Question[] } = $props();

	const typeLabels: Record<QuestionType, string> = {
		number: 'Zahl',
		'single-choice': 'Single-Choice',
		'multi-choice': 'Multi-Choice',
		range: 'Range'
	};

	function nextId(): string {
		let index = questions.length + 1;
		while (questions.some((question) => question.id === `q${index}`)) index += 1;
		return `q${index}`;
	}

	function addQuestion() {
		questions.push({ id: nextId(), text: '', type: 'number' });
	}

	function removeQuestion(index: number) {
		questions.splice(index, 1);
	}

	function changeType(question: Question, type: QuestionType) {
		question.type = type;
		if (type === 'single-choice' || type === 'multi-choice') question.options ??= ['', ''];
		else delete question.options;
		if (type === 'range') question.range ??= { min: 1, max: 10 };
		else delete question.range;
	}

	function setOptions(question: Question, value: string) {
		question.options = value.split('\n');
	}
</script>

<section>
	<h2>Fragen</h2>
	{#each questions as question, index (question.id)}
		<div class="question-card">
			<div class="question-header">
				<span class="question-id">{question.id}</span>
				<button type="button" class="remove-btn" onclick={() => removeQuestion(index)}>Entfernen</button>
			</div>
			<label class="field">
				<span class="label-text">Fragetext</span>
				<input type="text" bind:value={question.text} placeholder="z.B. Wie zufrieden bist du?" />
			</label>
			<label class="field">
				<span class="label-text">Typ</span>
				<select
					value={question.type}
					onchange={(event) => changeType(question, event.currentTarget.value as QuestionType)}
				>
					{#each Object.entries(typeLabels) as [value, label] (value)}
						<option {value}>{label}</option>
					{/each}
				</select>
			</label>
			{#if question.type === 'single-choice' || question.type === 'multi-choice'}
				<label class="field">
					<span class="label-text">Optionen (eine pro Zeile)</span>
					<textarea
						rows="4"
						value={(question.options ?? []).join('\n')}
						oninput={(event) => setOptions(question, event.currentTarget.value)}
					></textarea>
				</label>
			{/if}
			{#if question.type === 'number' || question.type === 'range'}
				<label class="field">
					<span class="label-text">Einheit (optional)</span>
					<input type="text" bind:value={question.unit} placeholder="z.B. %" />
				</label>
			{/if}
			{#if question.type === 'range' && question.range}
				<div class="range-row">
					<label class="field">
						<span class="label-text">Minimum</span>
						<input type="number" bind:value={question.range.min} />
					</label>
					<label class="field">
						<span class="label-text">Maximum</span>
						<input type="number" bind:value={question.range.max} />
					</label>
				</div>
			{/if}
		</div>
	{/each}
	<button type="button" class="add-btn" onclick={addQuestion}>Frage hinzufügen</button>
</section>

<style>
	h2 {
		font-size: var(--font-size-h4);
		margin: 0 0 var(--space-2);
	}
	.question-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-2);
		padding: var(--space-3);
		border: 1px solid #e0e0e0;
		border-radius: 12px;
		margin-bottom: var(--space-2);
	}
	.question-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.question-id {
		font-size: var(--font-size-small);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-muted);
	}
	.remove-btn {
		font-size: var(--font-size-small);
		font-weight: 600;
		background: none;
		border: none;
		color: var(--color-muted);
		cursor: pointer;
		padding: 4px 8px;
		border-radius: 4px;
		transition: color 0.15s;
	}
	.remove-btn:hover {
		color: var(--color-accent);
	}
	.field {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.label-text {
		font-size: var(--font-size-small);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-muted);
	}
	input,
	select,
	textarea {
		min-height: 40px;
		font-size: var(--font-size-body);
		font-family: inherit;
		padding: 8px 12px;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		background: var(--color-bg);
		color: var(--color-primary);
		transition: border-color 0.15s;
	}
	input:focus,
	select:focus,
	textarea:focus {
		outline: 2px solid var(--color-primary);
		outline-offset: 1px;
	}
	textarea {
		resize: vertical;
	}
	.range-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-2);
	}
	.add-btn {
		min-height: 40px;
		padding: 0 16px;
		font-size: var(--font-size-body);
		font-weight: 700;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		background: transparent;
		color: var(--color-primary);
		cursor: pointer;
		transition: border-color 0.15s;
	}
	.add-btn:hover {
		border-color: var(--color-primary);
	}
</style>
