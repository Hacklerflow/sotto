import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { eq } from 'drizzle-orm';
import { answerDb } from '../../../../../lib/server/answer-db';
import { responses, surveys } from '../../../../../../drizzle/answer-schema';
import { validateSurveyConfig, CHART_TYPES, type ChartType } from '../../../../../lib/types/survey';
import { aggregateSingleDimension } from '../../../../../lib/server/aggregator';
import type { Answers } from '../../../../../lib/server/binning';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const GET: RequestHandler = async ({ params, url }) => {
	if (!UUID_PATTERN.test(params.id)) error(404, 'Umfrage nicht gefunden');

	const x = url.searchParams.get('x');
	const y = url.searchParams.get('y');
	const chart = url.searchParams.get('chart') ?? 'scatter';

	if (!x || !y) error(400, 'x and y parameters required');
	if (!(CHART_TYPES as readonly string[]).includes(chart)) {
		error(400, `invalid chart type: ${chart}`);
	}

	const [survey] = await answerDb.select().from(surveys).where(eq(surveys.id, params.id));
	if (!survey) error(404, 'Umfrage nicht gefunden');
	if (survey.status !== 'closed') error(403, 'Ergebnisse noch nicht verfügbar');

	const config = validateSurveyConfig(survey.config);
	const questionIds = new Set(config.questions.map((question) => question.id));
	if (!questionIds.has(x)) error(400, `unknown question: ${x}`);
	if (!questionIds.has(y)) error(400, `unknown question: ${y}`);

	const rows = await answerDb
		.select({ answers: responses.answers })
		.from(responses)
		.where(eq(responses.surveyId, params.id));
	const answers = rows.map((row) => row.answers as Answers);

	const dimension = aggregateSingleDimension(
		config.questions,
		answers,
		x,
		y,
		chart as ChartType
	);

	return json({ dimension, questions: config.questions });
};
