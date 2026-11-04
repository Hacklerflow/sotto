import { afterAll, beforeEach, expect, test } from 'vitest';
import { eq } from 'drizzle-orm';
import { answerDb } from '../src/lib/server/answer-db';
import { freezeResults } from '../src/lib/server/aggregator';
import { resultSnapshots } from '../drizzle/answer-schema';
import {
	correlatedAnswers,
	createTestSurvey,
	insertAnswers,
	plainAnswers
} from './aggregation-fixtures';

let surveyId: string;

beforeEach(async () => {
	surveyId = await createTestSurvey();
});

afterAll(async () => {
	await answerDb.$client.end();
});

test('freezeResults refuses when threshold is not met', async () => {
	await insertAnswers(surveyId, plainAnswers(5));
	await expect(freezeResults(surveyId)).rejects.toThrow('threshold');
});

test('freezeResults bins numeric values: no single-respondent points', async () => {
	await insertAnswers(surveyId, plainAnswers(30));
	const snapshot = await freezeResults(surveyId);
	const scatter = snapshot.aggregatedData.dimensions[0];
	expect(scatter.points.length).toBeGreaterThan(0);
	expect(scatter.points.every((point) => point.count > 1)).toBe(true);
});

test('freezeResults calculates correlation coefficients', async () => {
	await insertAnswers(surveyId, correlatedAnswers(30, 0.8));
	const snapshot = await freezeResults(surveyId);
	expect(snapshot.aggregatedData.dimensions[0].correlation).toBeCloseTo(0.8, 1);
});

test('freezeResults suppresses categories with fewer than 3 entries', async () => {
	await insertAnswers(surveyId, [
		...plainAnswers(28),
		{ age: 30, income: 40000, channel: 'rare_category' },
		{ age: 40, income: 50000, channel: 'rare_category' }
	]);
	const snapshot = await freezeResults(surveyId);
	expect(snapshot.aggregatedData.suppressedCategories).toContain('rare_category');
	const bar = snapshot.aggregatedData.dimensions[1];
	expect(bar.points.some((point) => point.x === 'rare_category')).toBe(false);
});

test('freezeResults persists the snapshot', async () => {
	await insertAnswers(surveyId, plainAnswers(20));
	const snapshot = await freezeResults(surveyId);
	const [row] = await answerDb
		.select()
		.from(resultSnapshots)
		.where(eq(resultSnapshots.id, snapshot.id));
	expect(row.surveyId).toBe(surveyId);
	expect(Date.parse(snapshot.frozenAt)).not.toBeNaN();
});
