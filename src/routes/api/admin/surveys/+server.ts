import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isAdminRequest } from '../../../../lib/server/auth';
import { createSurvey } from '../../../../lib/server/invitations';
import { validateSurveyConfig } from '../../../../lib/types/survey';

export const POST: RequestHandler = async ({ request }) => {
	if (!isAdminRequest(request)) error(401, 'Unauthorized');
	const body: unknown = await request.json().catch(() => null);
	if (typeof body !== 'object' || body === null) error(400, 'Invalid JSON body');
	const { title, config } = body as { title?: unknown; config?: unknown };
	if (typeof title !== 'string' || title.trim() === '') error(400, 'title is required');
	if (typeof config !== 'object' || config === null || Array.isArray(config)) {
		error(400, 'config must be an object');
	}
	try {
		validateSurveyConfig(config);
	} catch (cause) {
		error(400, cause instanceof Error ? cause.message : 'Invalid config');
	}
	const survey = await createSurvey(title.trim(), config);
	return json(survey, { status: 201 });
};
