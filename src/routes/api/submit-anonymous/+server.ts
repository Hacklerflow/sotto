import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyAndStore } from '../../../lib/server/blind-signer';
import { base64ToBytes } from '../../../lib/encoding';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Anonymous by design: this handler never reads cookies or the session, only the signed payload.
export const POST: RequestHandler = async ({ request }) => {
	const body: unknown = await request.json().catch(() => null);
	if (typeof body !== 'object' || body === null) error(400, 'Invalid JSON body');
	const { surveyId, signature, message, answers } = body as {
		surveyId?: unknown;
		signature?: unknown;
		message?: unknown;
		answers?: unknown;
	};
	if (typeof surveyId !== 'string' || !UUID_PATTERN.test(surveyId)) error(400, 'invalid surveyId');
	if (typeof signature !== 'string' || typeof message !== 'string') {
		error(400, 'signature and message are required');
	}
	if (typeof answers !== 'object' || answers === null || Array.isArray(answers)) {
		error(400, 'answers must be an object');
	}
	let signatureBytes: Uint8Array;
	let messageBytes: Uint8Array;
	try {
		signatureBytes = base64ToBytes(signature);
		messageBytes = base64ToBytes(message);
	} catch {
		error(400, 'signature and message must be base64');
	}

	try {
		await verifyAndStore(surveyId, signatureBytes, messageBytes, answers as Record<string, unknown>);
	} catch (caught) {
		const reason = caught instanceof Error ? caught.message : '';
		if (reason === 'signature already used') error(409, 'signature already used');
		if (reason === 'invalid signature') error(403, 'invalid signature');
		if (reason === 'survey not found') error(404, 'survey not found');
		if (reason === 'survey not open') error(409, 'survey not open');
		error(500, 'submission failed');
	}
	return json({ ok: true }, { status: 201 });
};
