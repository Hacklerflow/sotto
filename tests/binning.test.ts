import { describe, it, expect } from 'vitest';
import {
	computeQuartileBins,
	binLabel,
	numericValues,
	isNumericQuestion,
	buildLabeler,
	MINIMUM_GROUP_SIZE,
	type Answers
} from '../src/lib/server/binning';
import type { Question } from '../src/lib/types/survey';

describe('isNumericQuestion', () => {
	it('returns true for number type', () => {
		expect(isNumericQuestion({ id: 'q1', text: 'Age', type: 'number' })).toBe(true);
	});

	it('returns true for range type', () => {
		expect(
			isNumericQuestion({ id: 'q1', text: 'Score', type: 'range', range: { min: 1, max: 10 } })
		).toBe(true);
	});

	it('returns false for single-choice', () => {
		expect(
			isNumericQuestion({
				id: 'q1',
				text: 'Color',
				type: 'single-choice',
				options: ['Red', 'Blue']
			})
		).toBe(false);
	});
});

describe('computeQuartileBins', () => {
	it('returns empty bins for empty input', () => {
		const result = computeQuartileBins([]);
		expect(result.edges).toEqual([]);
		expect(result.labels).toEqual([]);
	});

	it('returns single label for identical values', () => {
		const result = computeQuartileBins([5, 5, 5, 5]);
		expect(result.labels).toHaveLength(1);
	});

	it('creates bins for a spread of values', () => {
		const values = Array.from({ length: 100 }, (_, index) => index + 1);
		const result = computeQuartileBins(values);
		expect(result.edges.length).toBeGreaterThanOrEqual(2);
		expect(result.labels.length).toBe(result.edges.length - 1);
	});

	it('handles two distinct values', () => {
		const result = computeQuartileBins([10, 20]);
		expect(result.labels.length).toBeGreaterThanOrEqual(1);
	});
});

describe('binLabel', () => {
	it('assigns value to correct bin', () => {
		const bins = computeQuartileBins([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
		const label = binLabel(bins, 6);
		expect(typeof label).toBe('string');
		expect(label.length).toBeGreaterThan(0);
	});

	it('handles value at lower edge', () => {
		const bins = computeQuartileBins([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
		const label = binLabel(bins, 0);
		expect(typeof label).toBe('string');
	});

	it('handles value at upper edge', () => {
		const bins = computeQuartileBins([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
		const label = binLabel(bins, 100);
		expect(typeof label).toBe('string');
	});
});

describe('numericValues', () => {
	it('extracts numeric values from responses', () => {
		const responses: Answers[] = [{ q1: 5 }, { q1: 10 }, { q1: 'skip' }, { q1: 15 }];
		expect(numericValues(responses, 'q1')).toEqual([5, 10, 15]);
	});

	it('filters out NaN and Infinity', () => {
		const responses: Answers[] = [{ q1: NaN }, { q1: Infinity }, { q1: 3 }];
		expect(numericValues(responses, 'q1')).toEqual([3]);
	});

	it('returns empty array when question is missing', () => {
		const responses: Answers[] = [{ q2: 5 }];
		expect(numericValues(responses, 'q1')).toEqual([]);
	});
});

describe('buildLabeler', () => {
	const numericQuestion: Question = { id: 'q1', text: 'Score', type: 'number' };
	const choiceQuestion: Question = {
		id: 'q2',
		text: 'Team',
		type: 'single-choice',
		options: ['A', 'B', 'C']
	};

	it('labels numeric answers into bins', () => {
		const responses: Answers[] = Array.from({ length: 20 }, (_, index) => ({
			q1: (index + 1) * 5
		}));
		const labeler = buildLabeler(numericQuestion, responses);
		const result = labeler({ q1: 25 });
		expect(result).not.toBeNull();
		expect(result).toHaveLength(1);
	});

	it('returns null for missing numeric answer', () => {
		const responses: Answers[] = [{ q1: 10 }, { q1: 20 }];
		const labeler = buildLabeler(numericQuestion, responses);
		expect(labeler({ q2: 'irrelevant' })).toBeNull();
	});

	it('labels single-choice answers as-is', () => {
		const responses: Answers[] = [{ q2: 'A' }, { q2: 'B' }];
		const labeler = buildLabeler(choiceQuestion, responses);
		expect(labeler({ q2: 'A' })).toEqual(['A']);
	});

	it('labels array answers', () => {
		const multiQuestion: Question = {
			id: 'q3',
			text: 'Tags',
			type: 'multi-choice',
			options: ['X', 'Y']
		} as Question;
		const responses: Answers[] = [{ q3: ['X', 'Y'] }];
		const labeler = buildLabeler(multiQuestion, responses);
		expect(labeler({ q3: ['X'] })).toEqual(['X']);
	});

	it('returns null for empty array answer', () => {
		const multiQuestion: Question = {
			id: 'q3',
			text: 'Tags',
			type: 'multi-choice',
			options: ['X', 'Y']
		} as Question;
		const responses: Answers[] = [{ q3: ['X'] }];
		const labeler = buildLabeler(multiQuestion, responses);
		expect(labeler({ q3: [] })).toBeNull();
	});
});

describe('MINIMUM_GROUP_SIZE', () => {
	it('is 3', () => {
		expect(MINIMUM_GROUP_SIZE).toBe(3);
	});
});
