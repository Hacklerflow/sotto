import { eq } from 'drizzle-orm';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isAdminRequest } from '../../../../../lib/server/auth';
import { getSurveyById } from '../../../../../lib/server/invitations';
import { answerDb } from '../../../../../lib/server/answer-db';
import { identityDb } from '../../../../../lib/server/identity-db';
import { responses, resultSnapshots, surveys, surveyPublicKeys, usedSignatures } from '../../../../../../drizzle/answer-schema';
import { invitations, signingGrants, surveySigningKeys } from '../../../../../../drizzle/identity-schema';

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

export const DELETE: RequestHandler = async ({ request, params }) => {
	if (!isAdminRequest(request)) error(401, 'Unauthorized');
	const surveyId = params.id;

	await answerDb.delete(resultSnapshots).where(eq(resultSnapshots.surveyId, surveyId));
	await answerDb.delete(usedSignatures).where(eq(usedSignatures.surveyId, surveyId));
	await answerDb.delete(responses).where(eq(responses.surveyId, surveyId));
	await answerDb.delete(surveyPublicKeys).where(eq(surveyPublicKeys.surveyId, surveyId));

	await identityDb.delete(signingGrants).where(eq(signingGrants.surveyId, surveyId));
	await identityDb.delete(invitations).where(eq(invitations.surveyId, surveyId));
	await identityDb.delete(surveySigningKeys).where(eq(surveySigningKeys.surveyId, surveyId));

	const [deleted] = await answerDb
		.delete(surveys)
		.where(eq(surveys.id, surveyId))
		.returning();
	if (!deleted) error(404, 'Survey not found');
	return json({ deleted: true });
};
