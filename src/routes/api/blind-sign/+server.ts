import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSession } from '../../../lib/server/auth';
import { blindSign } from '../../../lib/server/blind-signer';
import { base64ToBytes, bytesToBase64 } from '../../../lib/encoding';
import { checkRateLimit } from '../../../lib/server/rate-limit';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BLINDED_MESSAGE_LENGTH_BYTES = 256;

export const POST: RequestHandler = async ({ request, cookies, getClientAddress }) => {
	const rate = checkRateLimit(`blind-sign:${getClientAddress()}`, 5);
	if (!rate.allowed) {
		return json({ error: 'Too many requests' }, {
			status: 429,
			headers: { 'Retry-After': String(Math.ceil(rate.retryAfterMs / 1000)) }
		});
	}
	const session = await getSession(cookies);
	if (!session) error(401, 'Unauthorized');
	const body: unknown = await request.json().catch(() => null);
	if (typeof body !== 'object' || body === null) error(400, 'Invalid JSON body');
	const { surveyId, blindedMessage } = body as { surveyId?: unknown; blindedMessage?: unknown };
	if (typeof surveyId !== 'string' || !UUID_PATTERN.test(surveyId)) error(400, 'invalid surveyId');
	if (typeof blindedMessage !== 'string') error(400, 'blindedMessage is required');
	let blinded: Uint8Array;
	try {
		blinded = base64ToBytes(blindedMessage);
	} catch {
		error(400, 'blindedMessage must be base64');
	}
	if (blinded.length !== BLINDED_MESSAGE_LENGTH_BYTES) error(400, 'invalid blindedMessage length');

	try {
		const signature = await blindSign(blinded, surveyId, session.userId);
		return json({ blindSignature: bytesToBase64(signature) });
	} catch (caught) {
		const message = caught instanceof Error ? caught.message : '';
		if (message === 'already signed') error(409, 'already signed');
		if (message === 'not eligible') error(403, 'not eligible');
		if (message === 'survey not found') error(404, 'survey not found');
		error(500, 'signing failed');
	}
};
