import { expect, test } from 'vitest';
import { validateSurveyConfig } from '../src/lib/types/survey';

const valid = {
	questions: [
		{ id: 'q1', text: 'Age', type: 'number' },
		{ id: 'q2', text: 'Income', type: 'range', range: { min: 0, max: 10 } },
		{ id: 'q3', text: 'Pick', type: 'single-choice', options: ['a', 'b'] }
	],
	dimensions: [{ xAxis: 'q1', yAxis: 'q2', sizeAxis: 'q3', chartType: 'bubble' }],
	visualizations: [{ dimensionIndex: 0 }]
};

test('accepts a valid config', () => {
	expect(() => validateSurveyConfig(valid)).not.toThrow();
});

test('survey config rejects questions without type', () => {
	expect(() => validateSurveyConfig({ questions: [{ id: 'q1', text: 'Foo' }] })).toThrow(
		'question type required'
	);
});

test('rejects free-text question type', () => {
	expect(() =>
		validateSurveyConfig({ questions: [{ id: 'q1', text: 'Foo', type: 'text' }] })
	).toThrow('invalid question type');
});

test('dimension references must match question ids', () => {
	const config = {
		questions: [{ id: 'q1', text: 'Age', type: 'number' }],
		dimensions: [{ xAxis: 'q1', yAxis: 'q_nonexistent', chartType: 'scatter' }]
	};
	expect(() => validateSurveyConfig(config)).toThrow('unknown question id');
});

test('size axis must match a question id', () => {
	const config = {
		...valid,
		dimensions: [{ xAxis: 'q1', yAxis: 'q2', sizeAxis: 'nope', chartType: 'bubble' }]
	};
	expect(() => validateSurveyConfig(config)).toThrow('unknown question id');
});

test('rejects invalid chart type, duplicate ids, bad choice and range questions', () => {
	expect(() =>
		validateSurveyConfig({ ...valid, dimensions: [{ xAxis: 'q1', yAxis: 'q2', chartType: 'pie' }] })
	).toThrow('invalid chart type');
	expect(() =>
		validateSurveyConfig({
			questions: [
				{ id: 'q1', text: 'A', type: 'number' },
				{ id: 'q1', text: 'B', type: 'number' }
			]
		})
	).toThrow('duplicate question id');
	expect(() =>
		validateSurveyConfig({ questions: [{ id: 'q1', text: 'A', type: 'single-choice', options: ['x'] }] })
	).toThrow('at least two options');
	expect(() =>
		validateSurveyConfig({
			questions: [{ id: 'q1', text: 'A', type: 'range', range: { min: 5, max: 5 } }]
		})
	).toThrow('min < max');
});

test('visualization must reference an existing dimension', () => {
	expect(() => validateSurveyConfig({ ...valid, visualizations: [{ dimensionIndex: 3 }] })).toThrow(
		'existing dimension'
	);
});
