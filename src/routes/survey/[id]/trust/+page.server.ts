import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getSurveyPublicKey } from '../../../../lib/server/blind-signer';
import { getSurveyProgress } from '../../../../lib/server/invitations';
import { checkThreshold } from '../../../../lib/server/threshold';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const load: PageServerLoad = async ({ params }) => {
	if (!UUID_PATTERN.test(params.id)) error(404, 'Umfrage nicht gefunden');
	const publicKey = await getSurveyPublicKey(params.id);
	if (!publicKey) error(404, 'Umfrage nicht gefunden');
	const [progress, threshold] = await Promise.all([
		getSurveyProgress(params.id),
		checkThreshold(params.id)
	]);
	return {
		invited: progress.invited,
		responded: progress.responded,
		thresholdMet: threshold.met,
		requiredCount: threshold.requiredCount,
		publicKey
	};
};
