import { eq } from 'drizzle-orm';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isAdminRequest } from '../../../../../lib/server/auth';
import { getSurveyById } from '../../../../../lib/server/invitations';
import { answerDb } from '../../../../../lib/server/answer-db';
import { surveys } from '../../../../../../drizzle/answer-schema';

const VALID_STATUSES = ['open', 'closed'] as const;

export const GET: RequestHandler = async ({ request, params }) => {
	if (!isAdminRequest(request)) error(401, 'Unauthorized');
	const survey = await getSurveyById(params.id);
	if (!survey) error(404, 'Survey not found');
	return json(survey);
};

export const PATCH: RequestHandler = async ({ request, params }) => {
	if (!isAdminRequest(request)) error(401, 'Unauthorized');
	const body: unknown = await request.json().catch(() => null);
	if (typeof body !== 'object' || body === null) error(400, 'Invalid JSON body');
	const { status } = body as { status?: unknown };
	if (typeof status !== 'string' || !VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
		error(400, `status must be one of: ${VALID_STATUSES.join(', ')}`);
	}
	const [updated] = await answerDb
		.update(surveys)
		.set({ status })
		.where(eq(surveys.id, params.id))
		.returning();
	if (!updated) error(404, 'Survey not found');
	return json(updated);
};
