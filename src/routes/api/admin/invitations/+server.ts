import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isAdminRequest } from '../../../../lib/server/auth';
import { createInvitations } from '../../../../lib/server/invitations';
import { getGroupMembers } from '../../../../lib/server/groups';

export const POST: RequestHandler = async ({ request }) => {
	if (!isAdminRequest(request)) error(401, 'Unauthorized');
	const body: unknown = await request.json().catch(() => null);
	if (typeof body !== 'object' || body === null) error(400, 'Invalid JSON body');
	const { surveyId, groupId, emails } = body as {
		surveyId?: unknown;
		groupId?: unknown;
		emails?: unknown;
	};
	if (typeof surveyId !== 'string') error(400, 'surveyId is required');

	let resolvedEmails: string[];
	if (typeof groupId === 'string') {
		const members = await getGroupMembers(groupId);
		if (members.length === 0) error(400, 'Group has no members');
		resolvedEmails = members.map((member) => member.email);
	} else if (Array.isArray(emails) && emails.every((email) => typeof email === 'string')) {
		resolvedEmails = emails as string[];
	} else {
		error(400, 'Either groupId or emails[] is required');
	}

	try {
		const created = await createInvitations(surveyId, resolvedEmails);
		return json(
			created.map(({ email, token }) => ({ email, token })),
			{ status: 201 }
		);
	} catch (cause) {
		if (cause instanceof Error && cause.message === 'survey not found')
			error(404, 'Survey not found');
		throw cause;
	}
};
