import { createHash } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { RSABSSA } from '@cloudflare/blindrsa-ts';
import { answerDb } from './answer-db';
import { identityDb } from './identity-db';
import {
	invitations,
	signingGrants,
	surveySigningKeys,
	users
} from '../../../drizzle/identity-schema';
import {
	responses,
	surveyPublicKeys,
	surveys,
	usedSignatures
} from '../../../drizzle/answer-schema';

export type EncryptedAnswers = Record<string, unknown>;

const MODULUS_LENGTH_BITS = 2048;
const PUBLIC_EXPONENT = new Uint8Array([0x01, 0x00, 0x01]);
const suite = RSABSSA.SHA384.PSS.Deterministic();

function toBase64(bytes: Uint8Array): string {
	return Buffer.from(bytes).toString('base64');
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
	return new Uint8Array(Buffer.from(value, 'base64'));
}

async function importPublicKey(spkiBase64: string): Promise<CryptoKey> {
	return crypto.subtle.importKey(
		'spki',
		fromBase64(spkiBase64),
		{ name: 'RSA-PSS', hash: 'SHA-384' },
		true,
		['verify']
	);
}

async function importPrivateKey(pkcs8Base64: string): Promise<CryptoKey> {
	return crypto.subtle.importKey(
		'pkcs8',
		fromBase64(pkcs8Base64),
		{ name: 'RSA-PSS', hash: 'SHA-384' },
		true,
		['sign']
	);
}

export async function generateSigningKeyPair(): Promise<CryptoKeyPair> {
	return suite.generateKey({
		modulusLength: MODULUS_LENGTH_BITS,
		publicExponent: PUBLIC_EXPONENT
	});
}

export type SurveyKeyMaterial = { privateKey: string; publicKey: string };

export async function generateSurveyKeyMaterial(): Promise<SurveyKeyMaterial> {
	const { privateKey, publicKey } = await generateSigningKeyPair();
	const [pkcs8, spki] = await Promise.all([
		crypto.subtle.exportKey('pkcs8', privateKey),
		crypto.subtle.exportKey('spki', publicKey)
	]);
	return { privateKey: toBase64(new Uint8Array(pkcs8)), publicKey: toBase64(new Uint8Array(spki)) };
}

export async function getSurveyPublicKey(surveyId: string): Promise<string | null> {
	const [row] = await answerDb
		.select({ publicKey: surveyPublicKeys.publicKey })
		.from(surveyPublicKeys)
		.where(eq(surveyPublicKeys.surveyId, surveyId));
	return row?.publicKey ?? null;
}

async function isEligible(userId: string, surveyId: string): Promise<boolean> {
	const [row] = await identityDb
		.select({ id: invitations.id })
		.from(invitations)
		.innerJoin(users, eq(users.email, invitations.email))
		.where(
			and(
				eq(users.id, userId),
				eq(invitations.surveyId, surveyId),
				eq(invitations.redeemed, true)
			)
		);
	return row !== undefined;
}

// Signs a blinded message. The server never sees the message content; it only records that this
// user has been granted one signature for this survey.
export async function blindSign(
	blindedMessage: Uint8Array,
	surveyId: string,
	userId: string
): Promise<Uint8Array> {
	const [keyRow] = await identityDb
		.select()
		.from(surveySigningKeys)
		.where(eq(surveySigningKeys.surveyId, surveyId));
	if (!keyRow) throw new Error('survey not found');
	if (!(await isEligible(userId, surveyId))) throw new Error('not eligible');

	const [grant] = await identityDb
		.insert(signingGrants)
		.values({ userId, surveyId })
		.onConflictDoNothing()
		.returning();
	if (!grant) throw new Error('already signed');

	try {
		return await suite.blindSign(await importPrivateKey(keyRow.privateKey), blindedMessage);
	} catch (error) {
		// Signing failed before anything was released, so the user may retry.
		await identityDb
			.delete(signingGrants)
			.where(and(eq(signingGrants.userId, userId), eq(signingGrants.surveyId, surveyId)));
		throw error;
	}
}

// Verifies an unblinded signature and stores the answer. No user identity is available here.
export async function verifyAndStore(
	surveyId: string,
	signature: Uint8Array,
	message: Uint8Array,
	answers: EncryptedAnswers
): Promise<void> {
	const publicKey = await getSurveyPublicKey(surveyId);
	if (!publicKey) throw new Error('survey not found');
	const [survey] = await answerDb
		.select({ status: surveys.status })
		.from(surveys)
		.where(eq(surveys.id, surveyId));
	if (!survey || survey.status !== 'open') throw new Error('survey not open');

	const valid = await suite.verify(await importPublicKey(publicKey), signature, message);
	if (!valid) throw new Error('invalid signature');

	const signatureHash = createHash('sha256').update(signature).digest('hex');
	await answerDb.transaction(async (transaction) => {
		const [claimed] = await transaction
			.insert(usedSignatures)
			.values({ signatureHash, surveyId })
			.onConflictDoNothing()
			.returning();
		if (!claimed) throw new Error('signature already used');
		await transaction
			.insert(responses)
			.values({ surveyId, blindSignature: toBase64(signature), answers });
	});
}
