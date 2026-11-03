import { desc, eq } from 'drizzle-orm';
import { answerDb } from './answer-db';
import { resultSnapshots, surveys } from '../../../drizzle/answer-schema';
import { validateSurveyConfig, type SurveyConfig } from '../types/survey';
import type { AggregatedData } from './aggregator';
import { checkThreshold } from './threshold';

export type SurveyResults =
	| { state: 'not-found' }
	| { state: 'waiting'; title: string; responseCount: number; requiredCount: number }
	| {
			state: 'ready';
			title: string;
			config: SurveyConfig;
			frozenAt: string;
			aggregatedData: AggregatedData;
	  };

export async function loadSurveyResults(surveyId: string): Promise<SurveyResults> {
	const [survey] = await answerDb.select().from(surveys).where(eq(surveys.id, surveyId));
	if (!survey) return { state: 'not-found' };

	const [snapshot] = await answerDb
		.select()
		.from(resultSnapshots)
		.where(eq(resultSnapshots.surveyId, surveyId))
		.orderBy(desc(resultSnapshots.frozenAt))
		.limit(1);
	if (survey.status === 'closed' && snapshot) {
		return {
			state: 'ready',
			title: survey.title,
			config: validateSurveyConfig(survey.config),
			frozenAt: snapshot.frozenAt.toISOString(),
			aggregatedData: snapshot.data as AggregatedData
		};
	}

	const threshold = await checkThreshold(surveyId);
	return {
		state: 'waiting',
		title: survey.title,
		responseCount: threshold.responseCount,
		requiredCount: threshold.requiredCount
	};
}
