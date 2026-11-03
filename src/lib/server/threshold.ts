import { eq } from 'drizzle-orm';
import { answerDb } from './answer-db';
import { responses, surveys } from '../../../drizzle/answer-schema';
import { validateSurveyConfig } from '../types/survey';
import { buildLabeler, MINIMUM_GROUP_SIZE, type Answers } from './binning';

export const MINIMUM_RESPONSES = 10;

export type ThresholdResult = {
	met: boolean;
	responseCount: number;
	requiredCount: number;
	warnings: string[];
};

export async function loadSurveyForAggregation(surveyId: string) {
	const [survey] = await answerDb.select().from(surveys).where(eq(surveys.id, surveyId));
	if (!survey) throw new Error('survey not found');
	const rows = await answerDb
		.select({ answers: responses.answers })
		.from(responses)
		.where(eq(responses.surveyId, surveyId));
	return {
		config: validateSurveyConfig(survey.config),
		answers: rows.map((row) => row.answers as Answers)
	};
}

export async function checkThreshold(surveyId: string): Promise<ThresholdResult> {
	const { config, answers } = await loadSurveyForAggregation(surveyId);
	const responseCount = answers.length;
	const warnings: string[] = [];

	if (responseCount < MINIMUM_RESPONSES) {
		warnings.push(`Only ${responseCount} of ${MINIMUM_RESPONSES} required responses`);
		return { met: false, responseCount, requiredCount: MINIMUM_RESPONSES, warnings };
	}

	config.dimensions.forEach((dimension, index) => {
		const questionIds = [dimension.xAxis, dimension.yAxis];
		if (dimension.sizeAxis) questionIds.push(dimension.sizeAxis);
		const labelers = questionIds.map((id) => {
			const question = config.questions.find((candidate) => candidate.id === id);
			if (!question) throw new Error(`unknown question id: ${id}`);
			return buildLabeler(question, answers);
		});
		const combinationCounts = new Map<string, number>();
		for (const response of answers) {
			const labels = labelers.map((labeler) => labeler(response));
			if (labels.some((label) => label === null)) continue;
			const key = labels.map((label) => (label as string[]).slice().sort().join('+')).join('|');
			combinationCounts.set(key, (combinationCounts.get(key) ?? 0) + 1);
		}
		const rare = [...combinationCounts.values()].filter((count) => count < MINIMUM_GROUP_SIZE);
		if (rare.length > 0) {
			warnings.push(
				`Dimension ${index + 1}: ${rare.length} rare combination(s) shared by fewer than ${MINIMUM_GROUP_SIZE} respondents`
			);
		}
	});

	return { met: true, responseCount, requiredCount: MINIMUM_RESPONSES, warnings };
}
