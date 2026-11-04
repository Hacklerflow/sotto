import { afterAll, beforeAll, expect, test } from 'vitest';
import { RSABSSA } from '@cloudflare/blindrsa-ts';
import { answerDb } from '../../src/lib/server/answer-db';
import { identityDb } from '../../src/lib/server/identity-db';
import {
	createInvitations,
	createSurvey,
	getSurveyProgress,
	redeemInvitation,
	type Invitation
} from '../../src/lib/server/invitations';
import { blindSign, getSurveyPublicKey, verifyAndStore } from '../../src/lib/server/blind-signer';
import { checkThreshold } from '../../src/lib/server/threshold';
import { freezeResults } from '../../src/lib/server/aggregator';
import { loadSurveyResults } from '../../src/lib/server/results';
import { responses } from '../../drizzle/answer-schema';
import { invitations, signingGrants, users } from '../../drizzle/identity-schema';
import { base64ToBytes } from '../../src/lib/encoding';
import type { Survey, SurveyConfig } from '../../src/lib/types/survey';

const INVITED_COUNT = 15;
const RESPONDING_COUNT = 12;
const suite = RSABSSA.SHA384.PSS.Deterministic();

const testConfig: SurveyConfig = {
	questions: [
		{ id: 'age', text: 'Alter', type: 'number' },
		{ id: 'income', text: 'Einkommen', type: 'number' },
		{ id: 'channel', text: 'Kanal', type: 'single-choice', options: ['Gallery', 'Online'] }
	],
	dimensions: [{ xAxis: 'age', yAxis: 'income', chartType: 'scatter' }],
	visualizations: []
};

function answersFor(index: number): Record<string, unknown> {
	return {
		age: 20 + (index % 5) * 10,
		income: 30000 + (index % 5) * 10000,
		channel: index % 2 === 0 ? 'Gallery' : 'Online'
	};
}

// Mirrors src/lib/client/blind-requester.ts without fetch/sessionStorage: blind locally, sign
// with the identity side, unblind locally. The answer side only ever sees signature and message.
async function obtainCredential(surveyId: string, userId: string) {
	const publicKeyBase64 = await getSurveyPublicKey(surveyId);
	if (!publicKeyBase64) throw new Error('missing public key');
	const publicKey = await crypto.subtle.importKey(
		'spki',
		base64ToBytes(publicKeyBase64),
		{ name: 'RSA-PSS', hash: 'SHA-384' },
		true,
		['verify']
	);
	const message = crypto.getRandomValues(new Uint8Array(32));
	const { blindedMsg, inv } = await suite.blind(publicKey, message);
	const blindSignature = await blindSign(blindedMsg, surveyId, userId);
	const signature = await suite.finalize(publicKey, message, blindSignature, inv);
	return { signature, message };
}

let survey: Survey;
let issued: Invitation[];

beforeAll(async () => {
	survey = await createSurvey('E2E Survey', testConfig);
	const emails = Array.from({ length: INVITED_COUNT }, (_, index) => `e2e-${survey.id}-${index}@example.test`);
	issued = await createInvitations(survey.id, emails);
});

afterAll(async () => {
	await answerDb.$client.end();
	await identityDb.$client.end();
});

test('full flow: create survey, invite, respond anonymously, view results', async () => {
	expect(issued).toHaveLength(INVITED_COUNT);

	for (const [index, invitation] of issued.slice(0, RESPONDING_COUNT).entries()) {
		const { userId, surveyId } = await redeemInvitation(invitation.token);
		expect(surveyId).toBe(survey.id);
		const { signature, message } = await obtainCredential(survey.id, userId);
		await verifyAndStore(survey.id, signature, message, answersFor(index));
	}

	const progress = await getSurveyProgress(survey.id);
	expect(progress).toEqual({ invited: INVITED_COUNT, responded: RESPONDING_COUNT });

	const threshold = await checkThreshold(survey.id);
	expect(threshold.met).toBe(true);
	expect(threshold.responseCount).toBe(RESPONDING_COUNT);

	const snapshot = await freezeResults(survey.id);
	expect(snapshot.aggregatedData).toBeDefined();
	expect(snapshot.aggregatedData.responseCount).toBe(RESPONDING_COUNT);

	// Same loader the results page uses (+page.server.ts).
	const results = await loadSurveyResults(survey.id);
	expect(results.state).not.toBe('not-found');
	expect(results.state).not.toBe('waiting');
});

test('responses cannot be linked to users via any DB query', async () => {
	const grants = await identityDb.select().from(signingGrants);
	const identityRows = [
		...grants,
		...(await identityDb.select().from(users)),
		...(await identityDb.select().from(invitations))
	];
	const answerRows = await answerDb.select().from(responses);
	expect(answerRows.length).toBeGreaterThanOrEqual(RESPONDING_COUNT);

	const identityValues = new Set(identityRows.flatMap((row) => Object.values(row).map(String)));
	for (const row of answerRows) {
		expect(identityValues.has(row.id)).toBe(false);
		expect(identityValues.has(row.blindSignature)).toBe(false);
	}
	// signing_grants holds no reference to what was signed.
	expect(Object.keys(grants[0] ?? { userId: 0, surveyId: 0 }).sort()).toEqual(['surveyId', 'userId']);
});
