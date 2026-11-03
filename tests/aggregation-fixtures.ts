import { answerDb } from '../src/lib/server/answer-db';
import { responses, surveys } from '../drizzle/answer-schema';
import type { SurveyConfig } from '../src/lib/types/survey';

export const config: SurveyConfig = {
	questions: [
		{ id: 'age', text: 'Age', type: 'number' },
		{ id: 'income', text: 'Income', type: 'number' },
		{ id: 'channel', text: 'Channel', type: 'single-choice', options: ['Gallery', 'Online', 'rare_category'] }
	],
	dimensions: [
		{ xAxis: 'age', yAxis: 'income', chartType: 'scatter' },
		{ xAxis: 'channel', yAxis: 'age', chartType: 'bar' }
	],
	visualizations: []
};

export async function createTestSurvey(): Promise<string> {
	const [row] = await answerDb
		.insert(surveys)
		.values({ title: 'fixture', config, status: 'open' })
		.returning({ id: surveys.id });
	return row.id;
}

type Answers = Record<string, number | string>;

export async function insertAnswers(surveyId: string, answers: Answers[]): Promise<void> {
	await answerDb.insert(responses).values(
		answers.map((answer) => ({ surveyId, blindSignature: crypto.randomUUID(), answers: answer }))
	);
}

// Deterministic pseudo-random in [0,1).
function noise(seed: number): number {
	const x = Math.sin(seed * 12.9898) * 43758.5453;
	return x - Math.floor(x);
}

export function plainAnswers(count: number): Answers[] {
	return Array.from({ length: count }, (_, index) => ({
		age: 20 + (index % 5) * 10,
		income: 30000 + (index % 5) * 10000,
		channel: index % 2 === 0 ? 'Gallery' : 'Online'
	}));
}

export function correlatedAnswers(count: number, target: number): Answers[] {
	// y = target * x_std + sqrt(1 - target^2) * residual, residual orthogonalized by construction below
	const xs = Array.from({ length: count }, (_, index) => index);
	const meanX = (count - 1) / 2;
	const residualRaw = xs.map((index) => noise(index + 1));
	const slope =
		xs.reduce((sum, x, i) => sum + (x - meanX) * residualRaw[i], 0) /
		xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0);
	const meanR = residualRaw.reduce((a, b) => a + b, 0) / count;
	const residual = residualRaw.map((r, i) => r - meanR - slope * (xs[i] - meanX));
	const sd = (values: number[]) => Math.sqrt(values.reduce((s, v) => s + v * v, 0) / count);
	const sdX = sd(xs.map((x) => x - meanX));
	const sdR = sd(residual);
	return xs.map((x, i) => ({
		age: x,
		income: target * ((x - meanX) / sdX) + Math.sqrt(1 - target ** 2) * (residual[i] / sdR),
		channel: 'Gallery'
	}));
}
