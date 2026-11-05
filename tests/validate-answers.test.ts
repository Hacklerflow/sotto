import { describe, it, expect } from 'vitest';
import { validateAnswers, type SurveyConfig } from '../src/lib/types/survey';

const config: SurveyConfig = {
	questions: [
		{ id: 'q1', text: 'Age', type: 'number' },
		{ id: 'q2', text: 'Team', type: 'single-choice', options: ['A', 'B', 'C'] },
		{ id: 'q3', text: 'Skills', type: 'multi-choice', options: ['JS', 'TS', 'Rust'] },
		{ id: 'q4', text: 'Score', type: 'range', range: { min: 1, max: 10 } }
	],
	dimensions: [],
	visualizations: []
};

describe('validateAnswers', () => {
	it('accepts valid answers', () => {
		const result = validateAnswers({ q1: 30, q2: 'A', q3: ['JS', 'TS'], q4: 5 }, config);
		expect(result).toEqual({ q1: 30, q2: 'A', q3: ['JS', 'TS'], q4: 5 });
	});

	it('skips missing answers', () => {
		const result = validateAnswers({ q1: 25 }, config);
		expect(result).toEqual({ q1: 25 });
	});

	it('strips unknown keys', () => {
		const result = validateAnswers({ q1: 10, unknown: 'hack' }, config);
		expect(result).toEqual({ q1: 10 });
		expect(result).not.toHaveProperty('unknown');
	});

	it('rejects non-numeric value for number question', () => {
		expect(() => validateAnswers({ q1: 'not a number' }, config)).toThrow('finite number');
	});

	it('rejects NaN for number question', () => {
		expect(() => validateAnswers({ q1: NaN }, config)).toThrow('finite number');
	});

	it('rejects out-of-range value', () => {
		expect(() => validateAnswers({ q4: 11 }, config)).toThrow('out of range');
	});

	it('accepts value at range boundary', () => {
		expect(validateAnswers({ q4: 1 }, config)).toEqual({ q4: 1 });
		expect(validateAnswers({ q4: 10 }, config)).toEqual({ q4: 10 });
	});

	it('rejects invalid single-choice option', () => {
		expect(() => validateAnswers({ q2: 'D' }, config)).toThrow('one of the options');
	});

	it('rejects invalid multi-choice option', () => {
		expect(() => validateAnswers({ q3: ['JS', 'Python'] }, config)).toThrow('valid options');
	});

	it('rejects non-array for multi-choice', () => {
		expect(() => validateAnswers({ q3: 'JS' }, config)).toThrow('valid options');
	});
});
