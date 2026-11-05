import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isAdminRequest } from '../../../../lib/server/auth';
import { createGroup, listGroups } from '../../../../lib/server/groups';

export const GET: RequestHandler = async ({ request }) => {
	if (!isAdminRequest(request)) error(401, 'Unauthorized');
	return json(await listGroups());
};

export const POST: RequestHandler = async ({ request }) => {
	if (!isAdminRequest(request)) error(401, 'Unauthorized');
	const body: unknown = await request.json().catch(() => null);
	if (typeof body !== 'object' || body === null) error(400, 'Invalid JSON body');
	const { name, members } = body as { name?: unknown; members?: unknown };
	if (typeof name !== 'string' || name.trim() === '') error(400, 'name is required');
	if (!Array.isArray(members)) error(400, 'members must be an array');
	for (const member of members) {
		if (typeof member !== 'object' || member === null) error(400, 'Invalid member');
		if (typeof member.name !== 'string') error(400, 'member.name is required');
		if (typeof member.email !== 'string') error(400, 'member.email is required');
	}
	try {
		const group = await createGroup(
			name.trim(),
			members as { name: string; email: string }[]
		);
		return json(group, { status: 201 });
	} catch (cause) {
		if (cause instanceof Error && cause.message.includes('already exists')) {
			error(409, cause.message);
		}
		throw cause;
	}
};
