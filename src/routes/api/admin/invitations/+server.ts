import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isAdminRequest } from '../../../../lib/server/auth';
import { createInvitations } from '../../../../lib/server/invitations';

export const POST: RequestHandler = async ({ request }) => {
	if (!isAdminRequest(request)) error(401, 'Unauthorized');
	const body: unknown = await request.json().catch(() => null);
	if (typeof body !== 'object' || body === null) error(400, 'Invalid JSON body');
	const { surveyId, emails } = body as { surveyId?: unknown; emails?: unknown };
	if (typeof surveyId !== 'string') error(400, 'surveyId is required');
	if (!Array.isArray(emails) || !emails.every((email) => typeof email === 'string')) {
		error(400, 'emails must be an array of strings');
	}
	try {
		const created = await createInvitations(surveyId, emails as string[]);
		return json(
			created.map(({ email, token }) => ({ email, token })),
			{ status: 201 }
		);
	} catch (cause) {
		if (cause instanceof Error && cause.message === 'survey not found') error(404, 'Survey not found');
		throw cause;
	}
};
