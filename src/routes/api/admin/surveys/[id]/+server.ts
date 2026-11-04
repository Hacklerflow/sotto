import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isAdminRequest } from '../../../../../lib/server/auth';
import { getSurveyById } from '../../../../../lib/server/invitations';

export const GET: RequestHandler = async ({ request, params }) => {
	if (!isAdminRequest(request)) error(401, 'Unauthorized');
	const survey = await getSurveyById(params.id);
	if (!survey) error(404, 'Survey not found');
	return json(survey);
};
