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
		<fieldset>
			<legend>{question.id}</legend>
			<label>
				Fragetext
				<input type="text" bind:value={question.text} />
			</label>
			<label>
				Typ
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
				<label>
					Optionen (eine pro Zeile)
					<textarea
						rows="4"
						value={(question.options ?? []).join('\n')}
						oninput={(event) => setOptions(question, event.currentTarget.value)}
					></textarea>
				</label>
			{/if}
			{#if question.type === 'number' || question.type === 'range'}
				<label>
					Einheit (optional)
					<input type="text" bind:value={question.unit} />
				</label>
			{/if}
			{#if question.type === 'range' && question.range}
				<label>
					Minimum
					<input type="number" bind:value={question.range.min} />
				</label>
				<label>
					Maximum
					<input type="number" bind:value={question.range.max} />
				</label>
			{/if}
			<button type="button" onclick={() => removeQuestion(index)}>Frage entfernen</button>
		</fieldset>
	{/each}
	<button type="button" onclick={addQuestion}>Frage hinzufügen</button>
</section>

<style>
	fieldset {
		display: grid;
		gap: var(--space-1);
		margin-bottom: var(--space-2);
	}
	label {
		display: grid;
		gap: 0.25rem;
	}
</style>
