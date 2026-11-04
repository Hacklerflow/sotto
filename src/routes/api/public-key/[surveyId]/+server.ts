import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSurveyPublicKey } from '../../../../lib/server/blind-signer';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const GET: RequestHandler = async ({ params }) => {
	if (!UUID_PATTERN.test(params.surveyId)) error(400, 'invalid surveyId');
	const publicKey = await getSurveyPublicKey(params.surveyId);
	if (!publicKey) error(404, 'survey not found');
	return json({ publicKey });
};
