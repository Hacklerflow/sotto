import { afterAll, expect, test } from 'vitest';
import { eq } from 'drizzle-orm';
import { answerDb } from '../src/lib/server/answer-db';
import { identityDb } from '../src/lib/server/identity-db';
import {
	createInvitations,
	createSurvey,
	getSurveyProgress,
	redeemInvitation
} from '../src/lib/server/invitations';
import { surveyCreators } from '../drizzle/identity-schema';
import { responses, surveys } from '../drizzle/answer-schema';

const defaultConfig = { questions: [], dimensions: [], visualizations: [] };

afterAll(async () => {
	await identityDb.$client.end();
	await answerDb.$client.end();
});

test('createSurvey writes to both databases with the same id', async () => {
	const survey = await createSurvey('Test', defaultConfig);
	const [answerRow] = await answerDb.select().from(surveys).where(eq(surveys.id, survey.id));
	const [identityRow] = await identityDb
		.select()
		.from(surveyCreators)
		.where(eq(surveyCreators.surveyId, survey.id));
	expect(answerRow.title).toBe('Test');
	expect(identityRow.surveyId).toBe(survey.id);
});

test('createInvitations generates unique tokens per email', async () => {
	const survey = await createSurvey('Test', defaultConfig);
	const invites = await createInvitations(survey.id, ['a@test.com', 'b@test.com']);
	expect(invites).toHaveLength(2);
	expect(invites[0].token).not.toBe(invites[1].token);
});

test('createInvitations rejects unknown survey', async () => {
	await expect(
		createInvitations('00000000-0000-4000-8000-000000000000', ['a@test.com'])
	).rejects.toThrow('survey not found');
});

test('redeemInvitation creates user and marks token used', async () => {
	const survey = await createSurvey('Test', defaultConfig);
	const [invite] = await createInvitations(survey.id, [`a-${survey.id}@test.com`]);
	const session = await redeemInvitation(invite.token);
	expect(session.userId).toBeDefined();
	expect(session.surveyId).toBe(survey.id);
});

test('redeemInvitation rejects already-used token', async () => {
	const survey = await createSurvey('Test', defaultConfig);
	const [invite] = await createInvitations(survey.id, [`b-${survey.id}@test.com`]);
	await redeemInvitation(invite.token);
	await expect(redeemInvitation(invite.token)).rejects.toThrow('already redeemed');
});

test('redeemInvitation rejects unknown token', async () => {
	await expect(redeemInvitation('nope')).rejects.toThrow('Invalid invitation');
});

test('redeemInvitation reuses the user for the same email across surveys', async () => {
	const email = `shared-${crypto.randomUUID()}@test.com`;
	const first = await createSurvey('One', defaultConfig);
	const second = await createSurvey('Two', defaultConfig);
	const [inviteOne] = await createInvitations(first.id, [email]);
	const [inviteTwo] = await createInvitations(second.id, [email]);
	const sessionOne = await redeemInvitation(inviteOne.token);
	const sessionTwo = await redeemInvitation(inviteTwo.token);
	expect(sessionOne.userId).toBe(sessionTwo.userId);
});

test('getSurveyProgress counts invitations and responses separately', async () => {
	const survey = await createSurvey('Progress', defaultConfig);
	await createInvitations(survey.id, ['p1@test.com', 'p2@test.com', 'p3@test.com']);
	await answerDb
		.insert(responses)
		.values({ surveyId: survey.id, blindSignature: 'sig', answers: {} });
	expect(await getSurveyProgress(survey.id)).toEqual({ invited: 3, responded: 1 });
});
