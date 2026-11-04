import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isAdminRequest } from '../../../../../../lib/server/auth';
import { getSurveyProgress } from '../../../../../../lib/server/invitations';

export const GET: RequestHandler = async ({ request, params }) => {
	if (!isAdminRequest(request)) error(401, 'Unauthorized');
	return json(await getSurveyProgress(params.id));
};
