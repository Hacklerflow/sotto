import { randomBytes, randomUUID } from 'node:crypto';
import { count, eq, sql } from 'drizzle-orm';
import { answerDb } from './answer-db';
import { identityDb } from './identity-db';
import { invitations, surveyCreators, surveySigningKeys, users } from '../../../drizzle/identity-schema';
import { responses, surveyPublicKeys, surveys } from '../../../drizzle/answer-schema';
import { generateSurveyKeyMaterial } from './blind-signer';
import type { Survey, SurveyConfig } from '../types/survey';

export type Invitation = typeof invitations.$inferSelect;

const ADMIN_CREATOR = 'admin';

function generateToken(): string {
	return `${randomUUID()}.${randomBytes(32).toString('hex')}`;
}

export async function createSurvey(title: string, config: SurveyConfig): Promise<Survey> {
	const [row] = await answerDb
		.insert(surveys)
		.values({ title, config, status: 'open' })
		.returning();
	try {
		const keys = await generateSurveyKeyMaterial();
		await answerDb.insert(surveyPublicKeys).values({ surveyId: row.id, publicKey: keys.publicKey });
		await identityDb.insert(surveyCreators).values({ surveyId: row.id, creator: ADMIN_CREATOR });
		await identityDb
			.insert(surveySigningKeys)
			.values({ surveyId: row.id, privateKey: keys.privateKey });
	} catch (error) {
		await answerDb.delete(surveyPublicKeys).where(eq(surveyPublicKeys.surveyId, row.id));
		await identityDb.delete(surveyCreators).where(eq(surveyCreators.surveyId, row.id));
		await answerDb.delete(surveys).where(eq(surveys.id, row.id));
		throw error;
	}
	return { ...row, config: row.config as SurveyConfig };
}

export async function createInvitations(surveyId: string, emails: string[]): Promise<Invitation[]> {
	const [creator] = await identityDb
		.select()
		.from(surveyCreators)
		.where(eq(surveyCreators.surveyId, surveyId));
	if (!creator) throw new Error('survey not found');
	const uniqueEmails = [...new Set(emails.map((email) => email.trim().toLowerCase()))].filter(
		(email) => email.length > 0
	);
	if (uniqueEmails.length === 0) return [];
	return identityDb
		.insert(invitations)
		.values(uniqueEmails.map((email) => ({ surveyId, email, token: generateToken() })))
		.returning();
}

export type InvitationStatus = 'valid' | 'redeemed' | 'unknown';

// Read-only check; never consumes the token.
export async function getInvitationStatus(token: string): Promise<InvitationStatus> {
	const [existing] = await identityDb
		.select({ redeemed: invitations.redeemed })
		.from(invitations)
		.where(eq(invitations.token, token));
	if (!existing) return 'unknown';
	return existing.redeemed ? 'redeemed' : 'valid';
}

export async function redeemInvitation(
	token: string
): Promise<{ userId: string; surveyId: string }> {
	return identityDb.transaction(async (transaction) => {
		const [claimed] = await transaction
			.update(invitations)
			.set({ redeemed: true })
			.where(sql`${invitations.token} = ${token} AND ${invitations.redeemed} = false`)
			.returning();
		if (!claimed) {
			const [existing] = await transaction
				.select({ id: invitations.id })
				.from(invitations)
				.where(eq(invitations.token, token));
			throw new Error(existing ? 'Invitation already redeemed' : 'Invalid invitation');
		}
		await transaction.insert(users).values({ email: claimed.email }).onConflictDoNothing();
		const [user] = await transaction.select().from(users).where(eq(users.email, claimed.email));
		return { userId: user.id, surveyId: claimed.surveyId };
	});
}

export async function getSurveyById(
	surveyId: string
): Promise<Survey | null> {
	const [row] = await answerDb.select().from(surveys).where(eq(surveys.id, surveyId));
	return row ? { ...row, config: row.config as SurveyConfig } : null;
}

export async function listSurveys(): Promise<Survey[]> {
	const rows = await answerDb.select().from(surveys);
	return rows.map((row) => ({ ...row, config: row.config as SurveyConfig }));
}

// The only function that reads both databases; it returns counts only, never identities.
export async function getSurveyProgress(
	surveyId: string
): Promise<{ invited: number; responded: number }> {
	const [invited] = await identityDb
		.select({ value: count() })
		.from(invitations)
		.where(eq(invitations.surveyId, surveyId));
	const [responded] = await answerDb
		.select({ value: count() })
		.from(responses)
		.where(eq(responses.surveyId, surveyId));
	return { invited: invited.value, responded: responded.value };
}
