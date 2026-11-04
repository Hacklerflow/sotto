/**
 * Seed script: creates a test group, a survey, invitations, and submits
 * 12 anonymous responses through the full blind RSA flow.
 *
 * Usage:
 *   IDENTITY_DB_URL="postgres://sotto:sotto-dev-identity@localhost:5433/sotto_identity" \
 *   ANSWER_DB_URL="postgres://sotto:sotto-dev-answer@localhost:5434/sotto_answer" \
 *   ADMIN_SECRET=sotto-admin-dev \
 *   npx tsx scripts/seed-responses.ts
 */

import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { drizzle } from 'drizzle-orm/postgres-js';
import { and, eq, sql } from 'drizzle-orm';
import postgres from 'postgres';
import { RSABSSA } from '@cloudflare/blindrsa-ts';

// --- Schema imports (no SvelteKit deps) ---
import {
	users,
	invitations,
	surveySigningKeys,
	signingGrants,
	groups,
	groupMembers,
	surveyCreators
} from '../drizzle/identity-schema';
import {
	surveys,
	surveyPublicKeys,
	responses,
	usedSignatures
} from '../drizzle/answer-schema';

// --- Config ---
const MEMBER_COUNT = 12;
const suite = RSABSSA.SHA384.PSS.Deterministic();

const identityUrl = process.env.IDENTITY_DB_URL;
const answerUrl = process.env.ANSWER_DB_URL;
if (!identityUrl || !answerUrl) {
	console.error('IDENTITY_DB_URL and ANSWER_DB_URL must be set');
	process.exit(1);
}

const identitySql = postgres(identityUrl);
const answerSql = postgres(answerUrl);
const identityDb = drizzle(identitySql);
const answerDb = drizzle(answerSql);

function toBase64(bytes: Uint8Array): string {
	return Buffer.from(bytes).toString('base64');
}

function fromBase64(value: string): Uint8Array {
	return new Uint8Array(Buffer.from(value, 'base64'));
}

function randomInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(array: T[]): T {
	return array[Math.floor(Math.random() * array.length)];
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

async function importPublicKey(spkiBase64: string): Promise<CryptoKey> {
	return crypto.subtle.importKey(
		'spki',
		fromBase64(spkiBase64),
		{ name: 'RSA-PSS', hash: 'SHA-384' },
		true,
		['verify']
	);
}

async function generateSurveyKeyMaterial() {
	const keyPair = await suite.generateKey({
		modulusLength: 2048,
		publicExponent: new Uint8Array([0x01, 0x00, 0x01])
	});
	const [pkcs8, spki] = await Promise.all([
		crypto.subtle.exportKey('pkcs8', keyPair.privateKey),
		crypto.subtle.exportKey('spki', keyPair.publicKey)
	]);
	return {
		keyPair,
		privateKeyBase64: toBase64(new Uint8Array(pkcs8)),
		publicKeyBase64: toBase64(new Uint8Array(spki))
	};
}

async function main() {
	console.log('--- Sotto Seed Script ---\n');

	// 1. Create group
	const memberData = Array.from({ length: MEMBER_COUNT }, (_, index) => ({
		name: `Testperson ${index + 1}`,
		email: `test${index + 1}@sotto-demo.local`
	}));

	console.log(`Erstelle Gruppe mit ${MEMBER_COUNT} Mitgliedern …`);
	const [group] = await identityDb.insert(groups).values({ name: 'Demo-Team Alpha' }).returning();
	await identityDb.insert(groupMembers).values(
		memberData.map((member) => ({ groupId: group.id, name: member.name, email: member.email }))
	);
	console.log(`  Gruppe erstellt: ${group.id}`);

	// 2. Create survey with mixed question types
	const surveyConfig = {
		questions: [
			{
				id: 'zufriedenheit',
				text: 'Wie zufrieden bist du insgesamt mit deiner Arbeit?',
				type: 'range',
				range: { min: 1, max: 10 }
			},
			{
				id: 'workload',
				text: 'Wie empfindest du deine aktuelle Arbeitsbelastung?',
				type: 'range',
				range: { min: 1, max: 10 }
			},
			{
				id: 'zusammenarbeit',
				text: 'Wie gut funktioniert die Zusammenarbeit im Team?',
				type: 'range',
				range: { min: 1, max: 10 }
			},
			{
				id: 'kommunikation',
				text: 'Wie bewertest du die interne Kommunikation?',
				type: 'single-choice',
				options: ['Sehr gut', 'Gut', 'Mittelmäßig', 'Schlecht']
			},
			{
				id: 'remote',
				text: 'Welches Arbeitsmodell bevorzugst du?',
				type: 'single-choice',
				options: ['Vollständig remote', 'Hybrid', 'Vollständig vor Ort']
			}
		],
		dimensions: [
			{ xAxis: 'zufriedenheit', yAxis: 'workload', chartType: 'scatter' },
			{ xAxis: 'zufriedenheit', yAxis: 'zusammenarbeit', chartType: 'scatter' }
		],
		visualizations: [{ dimensionIndex: 0 }, { dimensionIndex: 1 }]
	};

	console.log('Erstelle Umfrage …');
	const [survey] = await answerDb
		.insert(surveys)
		.values({ title: 'Teamklima-Check Q4 2026', config: surveyConfig, status: 'open' })
		.returning();
	const keys = await generateSurveyKeyMaterial();
	await answerDb.insert(surveyPublicKeys).values({ surveyId: survey.id, publicKey: keys.publicKeyBase64 });
	await identityDb.insert(surveyCreators).values({ surveyId: survey.id, creator: 'admin' });
	await identityDb.insert(surveySigningKeys).values({ surveyId: survey.id, privateKey: keys.privateKeyBase64 });
	console.log(`  Umfrage erstellt: ${survey.id}`);

	// 3. Create invitations
	console.log('Erstelle Einladungen …');
	const invitationRows = await identityDb.insert(invitations).values(
		memberData.map((member) => ({
			surveyId: survey.id,
			email: member.email,
			token: `${randomUUID()}.${randomBytes(32).toString('hex')}`
		}))
	).returning();
	console.log(`  ${invitationRows.length} Einladungen erstellt`);

	// 4. Use the key pair directly (avoid export/reimport issues)
	const { privateKey, publicKey } = keys.keyPair;

	// 5. For each invitation: redeem → blind-sign → submit
	console.log(`\nSende ${MEMBER_COUNT} anonyme Antworten …\n`);

	for (let index = 0; index < invitationRows.length; index++) {
		const invitation = invitationRows[index];
		const label = `  [${index + 1}/${MEMBER_COUNT}] ${invitation.email}`;

		// 5a. Redeem invitation
		await identityDb.update(invitations)
			.set({ redeemed: true })
			.where(eq(invitations.id, invitation.id));
		await identityDb.insert(users).values({ email: invitation.email }).onConflictDoNothing();
		const [user] = await identityDb.select().from(users).where(eq(users.email, invitation.email));

		// 5b. Record signing grant
		await identityDb.insert(signingGrants)
			.values({ userId: user.id, surveyId: survey.id })
			.onConflictDoNothing();

		// 5c. Client-side: generate random message and blind it
		const message = crypto.getRandomValues(new Uint8Array(32));
		const { blindedMsg, inv } = await suite.blind(publicKey, message);

		// 5d. Server-side: sign the blinded message
		const blindSig = await suite.blindSign(privateKey, blindedMsg);

		// 5e. Client-side: finalize (unblind) the signature
		const signature = await suite.finalize(publicKey, message, blindSig, inv);

		// 5f. Verify the signature is valid
		const valid = await suite.verify(publicKey, signature, message);
		if (!valid) {
			console.log(`${label}: Signatur-Verifizierung fehlgeschlagen`);
			continue;
		}

		// 5g. Generate randomized answers
		const answers: Record<string, unknown> = {
			zufriedenheit: randomInt(4, 10),
			workload: randomInt(3, 9),
			zusammenarbeit: randomInt(5, 10),
			kommunikation: pick(['Sehr gut', 'Gut', 'Mittelmäßig', 'Schlecht']),
			remote: pick(['Vollständig remote', 'Hybrid', 'Vollständig vor Ort'])
		};

		// 5h. Store the anonymous response (simulates POST /api/submit-anonymous)
		const signatureHash = createHash('sha256').update(signature).digest('hex');
		await answerDb.transaction(async (transaction) => {
			await transaction.insert(usedSignatures).values({ signatureHash, surveyId: survey.id });
			await transaction.insert(responses).values({
				surveyId: survey.id,
				blindSignature: toBase64(signature),
				answers
			});
		});

		console.log(`${label}: ✓ Antwort eingereicht`);
	}

	console.log('\n--- Fertig ---');
	console.log(`\nErgebnisse ansehen: http://localhost:5173/survey/${survey.id}/results`);
	console.log(`Admin-Ansicht:      http://localhost:5173/admin/surveys/${survey.id}`);

	// Close DB connections
	await identitySql.end();
	await answerSql.end();
}

main().catch(async (error) => {
	console.error('Fehler:', error);
	await identitySql.end();
	await answerSql.end();
	process.exit(1);
});
