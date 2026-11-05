import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isAdminRequest } from '../../../../../../lib/server/auth';
import { answerDb } from '../../../../../../lib/server/answer-db';
import { responses, surveys } from '../../../../../../../drizzle/answer-schema';
import { eq } from 'drizzle-orm';
import { validateSurveyConfig } from '../../../../../../lib/types/survey';

export const GET: RequestHandler = async ({ request, params }) => {
	if (!isAdminRequest(request)) error(401, 'Unauthorized');
	const [survey] = await answerDb
		.select({ title: surveys.title, config: surveys.config })
		.from(surveys)
		.where(eq(surveys.id, params.id));
	if (!survey) error(404, 'Survey not found');

	const config = validateSurveyConfig(survey.config);
	const questionIds = config.questions.map((question) => question.id);
	const headers = questionIds.map((id) => {
		const question = config.questions.find((q) => q.id === id);
		return question?.text ?? id;
	});

	const rows = await answerDb
		.select({ answers: responses.answers })
		.from(responses)
		.where(eq(responses.surveyId, params.id));

	const csvLines = [headers.map(escapeCsv).join(',')];
	for (const row of rows) {
		const answers = row.answers as Record<string, unknown>;
		const values = questionIds.map((id) => {
			const value = answers[id];
			if (value === undefined || value === null) return '';
			if (Array.isArray(value)) return escapeCsv(value.join('; '));
			return escapeCsv(String(value));
		});
		csvLines.push(values.join(','));
	}

	const csv = csvLines.join('\n') + '\n';
	const filename = `sotto-${slugify(survey.title)}-${params.id.slice(0, 8)}.csv`;

	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
};

function escapeCsv(value: string): string {
	if (value.includes(',') || value.includes('"') || value.includes('\n')) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}

function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/[äÄ]/g, 'ae')
		.replace(/[öÖ]/g, 'oe')
		.replace(/[üÜ]/g, 'ue')
		.replace(/ß/g, 'ss')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '')
		.slice(0, 40);
}
