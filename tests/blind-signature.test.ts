import { afterAll, beforeAll, expect, test } from 'vitest';
import { eq } from 'drizzle-orm';
import { RSABSSA } from '@cloudflare/blindrsa-ts';
import { answerDb } from '../src/lib/server/answer-db';
import { identityDb } from '../src/lib/server/identity-db';
import {
	blindSign,
	generateSigningKeyPair,
	getSurveyPublicKey,
	verifyAndStore
} from '../src/lib/server/blind-signer';
import { createInvitations, createSurvey, redeemInvitation } from '../src/lib/server/invitations';
import { responses } from '../drizzle/answer-schema';
import { signingGrants } from '../drizzle/identity-schema';

const suite = RSABSSA.SHA384.PSS.Deterministic();

afterAll(async () => {
	await identityDb.$client.end();
	await answerDb.$client.end();
});

async function importPublicKey(spkiBase64: string): Promise<CryptoKey> {
	return crypto.subtle.importKey(
		'spki',
		new Uint8Array(Buffer.from(spkiBase64, 'base64')),
		{ name: 'RSA-PSS', hash: 'SHA-384' },
		true,
		['verify']
	);
}

async function setup() {
	const survey = await createSurvey('Blind', { questions: [] });
	const [invite] = await createInvitations(survey.id, [`blind-${survey.id}@test.com`]);
	const { userId } = await redeemInvitation(invite.token);
	const publicKey = await importPublicKey((await getSurveyPublicKey(survey.id)) as string);
	return { surveyId: survey.id, userId, publicKey };
}

async function obtainCredential(surveyId: string, userId: string, publicKey: CryptoKey) {
	const message = crypto.getRandomValues(new Uint8Array(32));
	const { blindedMsg, inv } = await suite.blind(publicKey, message);
	const blindSignature = await blindSign(blindedMsg, surveyId, userId);
	const signature = await suite.finalize(publicKey, message, blindSignature, inv);
	return { signature, message };
}

let shared: Awaited<ReturnType<typeof setup>>;
beforeAll(async () => {
	shared = await setup();
}, 30_000);

test('blind signature roundtrip: sign blind, verify unblinded', async () => {
	const { publicKey, privateKey } = await generateSigningKeyPair();
	const message = crypto.getRandomValues(new Uint8Array(32));
	const { blindedMsg, inv } = await suite.blind(publicKey, message);
	const blindSignature = await suite.blindSign(privateKey, blindedMsg);
	const signature = await suite.finalize(publicKey, message, blindSignature, inv);
	expect(await suite.verify(publicKey, signature, message)).toBe(true);
});

test('server rejects second blind-sign request for same user+survey', async () => {
	const { surveyId, userId, publicKey } = await setup();
	const first = await suite.blind(publicKey, crypto.getRandomValues(new Uint8Array(32)));
	const second = await suite.blind(publicKey, crypto.getRandomValues(new Uint8Array(32)));
	await blindSign(first.blindedMsg, surveyId, userId);
	await expect(blindSign(second.blindedMsg, surveyId, userId)).rejects.toThrow('already signed');
});

test('blindSign rejects a user without a redeemed invitation', async () => {
	const { surveyId, publicKey } = await setup();
	const other = await setup();
	const blinded = await suite.blind(publicKey, crypto.getRandomValues(new Uint8Array(32)));
	await expect(blindSign(blinded.blindedMsg, surveyId, other.userId)).rejects.toThrow(
		'not eligible'
	);
});

test('failed signing releases the grant so the user can retry', async () => {
	const { surveyId, userId } = await setup();
	await expect(blindSign(new Uint8Array(10), surveyId, userId)).rejects.toThrow();
	const grants = await identityDb.select().from(signingGrants).where(eq(signingGrants.userId, userId));
	expect(grants).toHaveLength(0);
});

test('submit-anonymous accepts valid signature without knowing user', async () => {
	const { surveyId, userId, publicKey } = await setup();
	const { signature, message } = await obtainCredential(surveyId, userId, publicKey);
	await expect(verifyAndStore(surveyId, signature, message, { q1: 'x' })).resolves.toBeUndefined();
	const rows = await answerDb.select().from(responses).where(eq(responses.surveyId, surveyId));
	expect(rows).toHaveLength(1);
	expect(rows[0].answers).toEqual({ q1: 'x' });
	expect(Object.keys(rows[0])).not.toContain('userId');
});

test('submit-anonymous rejects reused signature', async () => {
	const { surveyId, userId, publicKey } = await setup();
	const { signature, message } = await obtainCredential(surveyId, userId, publicKey);
	await verifyAndStore(surveyId, signature, message, { q1: 'a' });
	await expect(verifyAndStore(surveyId, signature, message, { q1: 'b' })).rejects.toThrow(
		'signature already used'
	);
});

test('submit-anonymous rejects a forged signature', async () => {
	const { surveyId } = shared;
	await expect(
		verifyAndStore(surveyId, crypto.getRandomValues(new Uint8Array(256)), new Uint8Array(32), {})
	).rejects.toThrow();
});

test('signature from one survey is rejected by another', async () => {
	const first = await setup();
	const second = await setup();
	const { signature, message } = await obtainCredential(first.surveyId, first.userId, first.publicKey);
	await expect(verifyAndStore(second.surveyId, signature, message, {})).rejects.toThrow(
		'invalid signature'
	);
});
