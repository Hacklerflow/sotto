import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getSession } from '../../../lib/server/auth';
import { loadSurveyParticipation } from '../../../lib/server/survey-participation';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const load: PageServerLoad = async ({ params, cookies }) => {
	if (!UUID_PATTERN.test(params.id)) error(404, 'Umfrage nicht gefunden');
	const session = await getSession(cookies);
	if (!session) redirect(303, '/');

	const participation = await loadSurveyParticipation(params.id, session.userId);
	if (participation.state === 'not-found') error(404, 'Umfrage nicht gefunden');
	return { surveyId: params.id, participation };
};
