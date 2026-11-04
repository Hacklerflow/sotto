import { eq } from 'drizzle-orm';
import { answerDb } from './answer-db';
import { resultSnapshots, surveys } from '../../../drizzle/answer-schema';
import type { ChartType, Question } from '../types/survey';
import { buildLabeler, isNumericQuestion, MINIMUM_GROUP_SIZE, type Answers } from './binning';
import { loadSurveyForAggregation, MINIMUM_RESPONSES } from './threshold';

export type AggregatedPoint = {
	x: string;
	y: string;
	count: number;
	size?: number;
};
export type AggregatedFlow = { source: string; target: string; count: number };

export type AggregatedDimension = {
	index: number;
	chartType: ChartType;
	xAxis: string;
	yAxis: string;
	sizeAxis?: string;
	points: AggregatedPoint[];
	flows?: AggregatedFlow[];
	correlation: number | null;
	suppressedCells: number;
};

export type CategoryDistribution = {
	questionId: string;
	questionText: string;
	entries: { label: string; count: number }[];
	suppressedCount: number;
};

export type AggregatedData = {
	responseCount: number;
	dimensions: AggregatedDimension[];
	categories: CategoryDistribution[];
	suppressedCategories: string[];
};

export type ResultSnapshot = {
	id: string;
	surveyId: string;
	frozenAt: string;
	aggregatedData: AggregatedData;
};

export function pearsonCorrelation(pairs: [number, number][]): number | null {
	if (pairs.length < 2) return null;
	const meanX = pairs.reduce((sum, [x]) => sum + x, 0) / pairs.length;
	const meanY = pairs.reduce((sum, [, y]) => sum + y, 0) / pairs.length;
	let covariance = 0;
	let varianceX = 0;
	let varianceY = 0;
	for (const [x, y] of pairs) {
		covariance += (x - meanX) * (y - meanY);
		varianceX += (x - meanX) ** 2;
		varianceY += (y - meanY) ** 2;
	}
	if (varianceX === 0 || varianceY === 0) return null;
	return Math.round((covariance / Math.sqrt(varianceX * varianceY)) * 1000) / 1000;
}

// Suppression is per question: a rare option in one question must not hide it elsewhere.
function suppressionKey(questionId: string, option: string): string {
	return `${questionId}:${option}`;
}

// Categorical options chosen fewer than MINIMUM_GROUP_SIZE times are suppressed.
function findSuppressedCategories(
	questions: Question[],
	answers: Answers[]
): { suppressed: Set<string>; suppressedOptions: Set<string> } {
	const suppressed = new Set<string>();
	const suppressedOptions = new Set<string>();
	for (const question of questions) {
		if (isNumericQuestion(question)) continue;
		const counts = new Map<string, number>();
		for (const response of answers) {
			const value = response[question.id];
			const chosen = typeof value === 'string' ? [value] : Array.isArray(value) ? value : [];
			for (const option of chosen)
				counts.set(String(option), (counts.get(String(option)) ?? 0) + 1);
		}
		for (const [option, count] of counts) {
			if (count < MINIMUM_GROUP_SIZE) {
				suppressed.add(suppressionKey(question.id, option));
				suppressedOptions.add(option);
			}
		}
	}
	return { suppressed, suppressedOptions };
}

function aggregate(
	config: Awaited<ReturnType<typeof loadSurveyForAggregation>>['config'],
	answers: Answers[]
): AggregatedData {
	const { suppressed, suppressedOptions } = findSuppressedCategories(config.questions, answers);
	const findQuestion = (id: string): Question => {
		const question = config.questions.find((candidate) => candidate.id === id);
		if (!question) throw new Error(`unknown question id: ${id}`);
		return question;
	};

	const dimensions = config.dimensions.map((dimension, index): AggregatedDimension => {
		const xQuestion = findQuestion(dimension.xAxis);
		const yQuestion = findQuestion(dimension.yAxis);
		const sizeQuestion = dimension.sizeAxis ? findQuestion(dimension.sizeAxis) : undefined;
		const xLabeler = buildLabeler(xQuestion, answers);
		const yLabeler = buildLabeler(yQuestion, answers);

		const cells = new Map<string, { x: string; y: string; count: number; sizes: number[] }>();
		for (const response of answers) {
			const xLabels = xLabeler(response);
			const yLabels = yLabeler(response);
			if (!xLabels || !yLabels) continue;
			const sizeValue = sizeQuestion ? response[sizeQuestion.id] : undefined;
			for (const x of xLabels) {
				for (const y of yLabels) {
					if (
						suppressed.has(suppressionKey(xQuestion.id, x)) ||
						suppressed.has(suppressionKey(yQuestion.id, y))
					)
						continue;
					const key = JSON.stringify([x, y]);
					const cell = cells.get(key) ?? { x, y, count: 0, sizes: [] };
					cell.count += 1;
					if (typeof sizeValue === 'number') cell.sizes.push(sizeValue);
					cells.set(key, cell);
				}
			}
		}

		const points: AggregatedPoint[] = [];
		let suppressedCells = 0;
		for (const cell of cells.values()) {
			if (cell.count < MINIMUM_GROUP_SIZE) {
				suppressedCells += 1;
				continue;
			}
			const point: AggregatedPoint = {
				x: cell.x,
				y: cell.y,
				count: cell.count
			};
			if (cell.sizes.length > 0) {
				point.size =
					Math.round((cell.sizes.reduce((sum, size) => sum + size, 0) / cell.sizes.length) * 100) /
					100;
			}
			points.push(point);
		}

		let correlation: number | null = null;
		if (isNumericQuestion(xQuestion) && isNumericQuestion(yQuestion)) {
			const pairs: [number, number][] = [];
			for (const response of answers) {
				const x = response[xQuestion.id];
				const y = response[yQuestion.id];
				if (typeof x === 'number' && typeof y === 'number') pairs.push([x, y]);
			}
			correlation = pearsonCorrelation(pairs);
		}

		const result: AggregatedDimension = {
			index,
			chartType: dimension.chartType,
			xAxis: dimension.xAxis,
			yAxis: dimension.yAxis,
			points,
			correlation,
			suppressedCells
		};
		if (dimension.sizeAxis) result.sizeAxis = dimension.sizeAxis;
		if (dimension.chartType === 'sankey') {
			result.flows = points.map((point) => ({
				source: point.x,
				target: point.y,
				count: point.count
			}));
		}
		return result;
	});

	const categories: CategoryDistribution[] = [];
	for (const question of config.questions) {
		if (isNumericQuestion(question)) continue;
		const counts = new Map<string, number>();
		for (const response of answers) {
			const value = response[question.id];
			const chosen = typeof value === 'string' ? [value] : Array.isArray(value) ? value : [];
			for (const option of chosen)
				counts.set(String(option), (counts.get(String(option)) ?? 0) + 1);
		}
		const entries: { label: string; count: number }[] = [];
		let suppressedCount = 0;
		for (const [option, count] of counts) {
			if (suppressed.has(suppressionKey(question.id, option))) {
				suppressedCount += count;
			} else {
				entries.push({ label: option, count });
			}
		}
		entries.sort((a, b) => b.count - a.count);
		if (entries.length > 0) {
			categories.push({
				questionId: question.id,
				questionText: question.text,
				entries,
				suppressedCount
			});
		}
	}

	return {
		responseCount: answers.length,
		dimensions,
		categories,
		suppressedCategories: [...suppressedOptions].sort()
	};
}

export class AlreadyFrozenError extends Error {
	constructor() {
		super('survey already frozen');
	}
}

// One snapshot per survey, and freezing closes the survey, so two snapshots at n and n+1
// responses can never be diffed to recover a single answer. The status update runs first
// and takes the survey row lock, serializing concurrent freezes; any throw rolls it back.
export async function freezeResults(surveyId: string): Promise<ResultSnapshot> {
	return answerDb.transaction(async (transaction) => {
		const closed = await transaction
			.update(surveys)
			.set({ status: 'closed' })
			.where(eq(surveys.id, surveyId))
			.returning({ id: surveys.id });
		if (closed.length === 0) throw new Error('survey not found');
		const existing = await transaction
			.select({ id: resultSnapshots.id })
			.from(resultSnapshots)
			.where(eq(resultSnapshots.surveyId, surveyId));
		if (existing.length > 0) throw new AlreadyFrozenError();
		const { config, answers } = await loadSurveyForAggregation(surveyId, transaction);
		if (answers.length < MINIMUM_RESPONSES) throw new Error('anonymity threshold not met');
		const aggregatedData = aggregate(config, answers);
		const [row] = await transaction
			.insert(resultSnapshots)
			.values({ surveyId, data: aggregatedData })
			.returning();
		await transaction.update(surveys).set({ thresholdMet: true }).where(eq(surveys.id, surveyId));
		return {
			id: row.id,
			surveyId,
			frozenAt: row.frozenAt.toISOString(),
			aggregatedData
		};
	});
}
