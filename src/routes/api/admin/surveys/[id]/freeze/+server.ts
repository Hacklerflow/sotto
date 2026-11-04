import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isAdminRequest } from '../../../../../../lib/server/auth';
import { AlreadyFrozenError, freezeResults } from '../../../../../../lib/server/aggregator';
import { checkThreshold } from '../../../../../../lib/server/threshold';

export const POST: RequestHandler = async ({ request, params }) => {
	if (!isAdminRequest(request)) error(401, 'Unauthorized');
	let threshold;
	try {
		threshold = await checkThreshold(params.id);
	} catch {
		error(404, 'Survey not found');
	}
	if (!threshold.met)
		return json({ error: 'Anonymity threshold not met', threshold }, { status: 409 });
	try {
		return json({
			snapshot: await freezeResults(params.id),
			warnings: threshold.warnings
		});
	} catch (caught) {
		if (caught instanceof AlreadyFrozenError) {
			return json({ error: 'Survey already frozen' }, { status: 409 });
		}
		throw caught;
	}
};
