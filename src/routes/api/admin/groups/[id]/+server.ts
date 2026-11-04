import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isAdminRequest } from '../../../../../lib/server/auth';
import { getGroup, updateGroup, getGroupMembers, getGroupSurveyIds } from '../../../../../lib/server/groups';
import { getSurveyById } from '../../../../../lib/server/invitations';

export const GET: RequestHandler = async ({ request, params }) => {
	if (!isAdminRequest(request)) error(401, 'Unauthorized');
	const group = await getGroup(params.id);
	if (!group) error(404, 'Group not found');
	const members = await getGroupMembers(params.id);
	const surveyIds = await getGroupSurveyIds(params.id);
	const surveys = (
		await Promise.all(surveyIds.map((id) => getSurveyById(id)))
	).filter((survey) => survey !== null);
	return json({ ...group, members, surveys });
};

export const PATCH: RequestHandler = async ({ request, params }) => {
	if (!isAdminRequest(request)) error(401, 'Unauthorized');
	const body: unknown = await request.json().catch(() => null);
	if (typeof body !== 'object' || body === null) error(400, 'Invalid JSON body');
	const { name } = body as { name?: unknown };
	if (typeof name !== 'string' || name.trim() === '') error(400, 'name is required');
	const group = await updateGroup(params.id, name.trim());
	if (!group) error(404, 'Group not found');
	return json(group);
};
