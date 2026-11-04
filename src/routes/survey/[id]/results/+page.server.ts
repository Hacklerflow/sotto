import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { loadSurveyResults } from '../../../../lib/server/results';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Public on purpose: frozen results are aggregated and anonymous, the link is the access.
export const load: PageServerLoad = async ({ params }) => {
	if (!UUID_PATTERN.test(params.id)) error(404, 'Umfrage nicht gefunden');
	const results = await loadSurveyResults(params.id);
	if (results.state === 'not-found') error(404, 'Umfrage nicht gefunden');
	return { results, surveyId: params.id };
};
