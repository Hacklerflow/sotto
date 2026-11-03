import { afterAll, beforeEach, expect, test } from 'vitest';
import { answerDb } from '../src/lib/server/answer-db';
import { checkThreshold } from '../src/lib/server/threshold';
import { createTestSurvey, insertAnswers, plainAnswers } from './aggregation-fixtures';

let surveyId: string;

beforeEach(async () => {
	surveyId = await createTestSurvey();
});

afterAll(async () => {
	await answerDb.$client.end();
});

test('threshold not met with fewer than 10 responses', async () => {
	await insertAnswers(surveyId, plainAnswers(8));
	const result = await checkThreshold(surveyId);
	expect(result.met).toBe(false);
	expect(result.responseCount).toBe(8);
	expect(result.requiredCount).toBeGreaterThanOrEqual(10);
});

test('threshold met with sufficient responses', async () => {
	await insertAnswers(surveyId, plainAnswers(30));
	const result = await checkThreshold(surveyId);
	expect(result.met).toBe(true);
	expect(result.warnings).toEqual([]);
});

test('threshold warns about quasi-identifiable combinations', async () => {
	await insertAnswers(surveyId, [
		...plainAnswers(24),
		{ age: 60, income: 200000, channel: 'Gallery' }
	]);
	const result = await checkThreshold(surveyId);
	expect(result.met).toBe(true);
	expect(result.warnings.some((warning) => warning.includes('rare combination'))).toBe(true);
});
