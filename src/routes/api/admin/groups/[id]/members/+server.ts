import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isAdminRequest } from '../../../../../../lib/server/auth';
import { addGroupMembers, removeGroupMember } from '../../../../../../lib/server/groups';

export const POST: RequestHandler = async ({ request, params }) => {
	if (!isAdminRequest(request)) error(401, 'Unauthorized');
	const body: unknown = await request.json().catch(() => null);
	if (!Array.isArray(body)) error(400, 'Body must be an array of {name, email}');
	for (const member of body) {
		if (typeof member !== 'object' || member === null) error(400, 'Invalid member');
		if (typeof member.name !== 'string') error(400, 'member.name is required');
		if (typeof member.email !== 'string') error(400, 'member.email is required');
	}
	const added = await addGroupMembers(params.id, body as { name: string; email: string }[]);
	return json(added, { status: 201 });
};

export const DELETE: RequestHandler = async ({ request, params, url }) => {
	if (!isAdminRequest(request)) error(401, 'Unauthorized');
	const memberId = url.searchParams.get('memberId');
	if (!memberId) error(400, 'memberId query parameter is required');
	const removed = await removeGroupMember(params.id, memberId);
	if (!removed) error(404, 'Member not found');
	return new Response(null, { status: 204 });
};
