import { eq } from 'drizzle-orm';
import { identityDb } from './identity-db';
import { groups, groupMembers, invitations } from '../../../drizzle/identity-schema';

export type Group = typeof groups.$inferSelect;
export type GroupMember = typeof groupMembers.$inferSelect;

export async function createGroup(
	name: string,
	members: { name: string; email: string }[]
): Promise<Group> {
	const [existing] = await identityDb
		.select()
		.from(groups)
		.where(eq(groups.name, name));
	if (existing) throw new Error(`group "${name}" already exists`);
	const [group] = await identityDb.insert(groups).values({ name }).returning();
	if (members.length > 0) {
		const unique = deduplicateMembers(members);
		await identityDb
			.insert(groupMembers)
			.values(unique.map((member) => ({ groupId: group.id, ...member })));
	}
	return group;
}

export async function listGroups(): Promise<Group[]> {
	return identityDb.select().from(groups);
}

export async function getGroup(groupId: string): Promise<Group | null> {
	const [row] = await identityDb.select().from(groups).where(eq(groups.id, groupId));
	return row ?? null;
}

export async function updateGroup(groupId: string, name: string): Promise<Group | null> {
	const [row] = await identityDb
		.update(groups)
		.set({ name })
		.where(eq(groups.id, groupId))
		.returning();
	return row ?? null;
}

export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
	return identityDb.select().from(groupMembers).where(eq(groupMembers.groupId, groupId));
}

export async function addGroupMembers(
	groupId: string,
	members: { name: string; email: string }[]
): Promise<GroupMember[]> {
	if (members.length === 0) return [];
	const unique = deduplicateMembers(members);
	return identityDb
		.insert(groupMembers)
		.values(unique.map((member) => ({ groupId, ...member })))
		.onConflictDoNothing()
		.returning();
}

export async function removeGroupMember(groupId: string, memberId: string): Promise<boolean> {
	const result = await identityDb
		.delete(groupMembers)
		.where(eq(groupMembers.id, memberId))
		.returning();
	return result.length > 0;
}

export async function getGroupSurveyIds(groupId: string): Promise<string[]> {
	const rows = await identityDb
		.select({ surveyId: invitations.surveyId })
		.from(invitations)
		.innerJoin(groupMembers, eq(invitations.email, groupMembers.email))
		.where(eq(groupMembers.groupId, groupId))
		.groupBy(invitations.surveyId);
	return rows.map((row) => row.surveyId);
}

function deduplicateMembers(
	members: { name: string; email: string }[]
): { name: string; email: string }[] {
	const seen = new Map<string, { name: string; email: string }>();
	for (const member of members) {
		const normalized = member.email.trim().toLowerCase();
		if (normalized && !seen.has(normalized)) {
			seen.set(normalized, { name: member.name.trim(), email: normalized });
		}
	}
	return [...seen.values()];
}
