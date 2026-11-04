/**
 * Seed script: creates a realistic artist survey with 30 diverse respondents.
 *
 * Usage:
 *   IDENTITY_DB_URL="postgres://sotto:sotto-dev-identity@localhost:5433/sotto_identity" \
 *   ANSWER_DB_URL="postgres://sotto:sotto-dev-answer@localhost:5434/sotto_answer" \
 *   npx tsx scripts/seed-artists.ts
 */

import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import { RSABSSA } from '@cloudflare/blindrsa-ts';

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

const MEMBER_COUNT = 30;
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

function randomInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function jitter(base: number, percent: number): number {
	const range = base * percent;
	return Math.max(0, Math.round(base + (Math.random() - 0.5) * 2 * range));
}

function pick<T>(array: T[]): T {
	return array[Math.floor(Math.random() * array.length)];
}

// --- Survey configuration ---

const surveyConfig = {
	questions: [
		{
			id: 'einkommen_gesamt',
			text: 'Wie hoch war dein Gesamteinkommen aus künstlerischer Tätigkeit im letzten Jahr? (€)',
			type: 'range',
			range: { min: 0, max: 150000 }
		},
		{
			id: 'einkommen_ausstellungen',
			text: 'Davon aus Verkäufen bei Ausstellungen? (€)',
			type: 'range',
			range: { min: 0, max: 100000 }
		},
		{
			id: 'einkommen_auftraege',
			text: 'Davon aus Auftragsarbeiten und Kommissionen? (€)',
			type: 'range',
			range: { min: 0, max: 80000 }
		},
		{
			id: 'einkommen_online',
			text: 'Davon aus Online-Verkäufen (eigene Website, Plattformen)? (€)',
			type: 'range',
			range: { min: 0, max: 50000 }
		},
		{
			id: 'unterstuetzung_familie',
			text: 'Finanzielle Unterstützung durch Familie oder Partner:in pro Jahr? (€)',
			type: 'range',
			range: { min: 0, max: 40000 }
		},
		{
			id: 'foerderungen',
			text: 'Erhaltene Förderungen, Stipendien und Preisgelder im letzten Jahr? (€)',
			type: 'range',
			range: { min: 0, max: 30000 }
		},
		{
			id: 'ausgaben_gesamt',
			text: 'Monatliche Gesamtausgaben für deine Kunstpraxis (Atelier, Material, Versicherung)? (€)',
			type: 'range',
			range: { min: 50, max: 5000 }
		},
		{
			id: 'ausgaben_material',
			text: 'Jährliche Ausgaben nur für Kunstmaterial und Werkzeug? (€)',
			type: 'range',
			range: { min: 100, max: 15000 }
		},
		{
			id: 'werke_verkauft',
			text: 'Wie viele Arbeiten hast du im letzten Jahr verkauft?',
			type: 'range',
			range: { min: 0, max: 200 }
		},
		{
			id: 'preis_max',
			text: 'Höchster Verkaufspreis einer einzelnen Arbeit im letzten Jahr? (€)',
			type: 'range',
			range: { min: 0, max: 50000 }
		},
		{
			id: 'preis_min',
			text: 'Niedrigster Verkaufspreis einer einzelnen Arbeit im letzten Jahr? (€)',
			type: 'range',
			range: { min: 0, max: 5000 }
		},
		{
			id: 'preis_durchschnitt',
			text: 'Ungefährer Durchschnittspreis deiner verkauften Arbeiten? (€)',
			type: 'range',
			range: { min: 0, max: 20000 }
		},
		{
			id: 'ausstellungen_gesamt',
			text: 'An wie vielen Ausstellungen hast du insgesamt teilgenommen (Karriere)?',
			type: 'range',
			range: { min: 0, max: 100 }
		},
		{
			id: 'einzelausstellungen',
			text: 'Davon Einzelausstellungen?',
			type: 'range',
			range: { min: 0, max: 30 }
		},
		{
			id: 'provision_galerie',
			text: 'Wie viel Prozent Provision bekommt deine Galerie / dein Hauptverkaufspartner?',
			type: 'range',
			range: { min: 0, max: 60 }
		},
		{
			id: 'provision_andere',
			text: 'Provision anderer Verkaufskanäle (Online-Plattformen, Messen)? (%)',
			type: 'range',
			range: { min: 0, max: 40 }
		},
		{
			id: 'instagram_follower',
			text: 'Wie viele Follower hast du auf Instagram?',
			type: 'range',
			range: { min: 0, max: 100000 }
		},
		{
			id: 'hauptkanal',
			text: 'Welcher ist dein wichtigster Verkaufskanal?',
			type: 'single-choice',
			options: ['Galerie', 'Eigene Website', 'Online-Plattform (Etsy, Artsy …)', 'Direkt aus dem Atelier', 'Kunstmessen']
		},
		{
			id: 'social_media',
			text: 'Welche Social-Media-Kanäle nutzt du aktiv für deine Kunst?',
			type: 'single-choice',
			options: ['Instagram', 'TikTok', 'LinkedIn', 'YouTube', 'Keine']
		},
		{
			id: 'arbeitsweise',
			text: 'Wie arbeitest du hauptsächlich?',
			type: 'single-choice',
			options: ['Allein', 'Mit Assistent:in(nen)', 'Im Kollektiv/Team', 'Wechselnd']
		},
		{
			id: 'zusammenarbeit',
			text: 'Wie oft arbeitest du mit anderen Künstler:innen zusammen?',
			type: 'single-choice',
			options: ['Nie', 'Selten (1–2× im Jahr)', 'Regelmäßig (monatlich)', 'Hauptsächlich im Team']
		},
		{
			id: 'nebeneinkommen',
			text: 'Hast du Einkommen außerhalb der Kunst (Lehre, Brotjob, etc.)?',
			type: 'single-choice',
			options: ['Nein, lebe nur von der Kunst', 'Ja, unter 500 €/Monat', 'Ja, 500–1500 €/Monat', 'Ja, über 1500 €/Monat']
		}
	],
	dimensions: [
		{ xAxis: 'instagram_follower', yAxis: 'einkommen_gesamt', chartType: 'scatter' },
		{ xAxis: 'ausstellungen_gesamt', yAxis: 'preis_max', chartType: 'scatter' },
		{ xAxis: 'werke_verkauft', yAxis: 'preis_durchschnitt', chartType: 'scatter' },
		{ xAxis: 'foerderungen', yAxis: 'einkommen_gesamt', chartType: 'scatter' },
		{ xAxis: 'einkommen_gesamt', yAxis: 'ausgaben_material', chartType: 'scatter' }
	],
	visualizations: [
		{ dimensionIndex: 0 },
		{ dimensionIndex: 1 },
		{ dimensionIndex: 2 },
		{ dimensionIndex: 3 },
		{ dimensionIndex: 4 }
	]
};

// --- 30 diverse artist archetypes ---

interface ArtistProfile {
	einkommen_gesamt: number;
	einkommen_ausstellungen: number;
	einkommen_auftraege: number;
	einkommen_online: number;
	unterstuetzung_familie: number;
	foerderungen: number;
	ausgaben_gesamt: number;
	ausgaben_material: number;
	werke_verkauft: number;
	preis_max: number;
	preis_min: number;
	preis_durchschnitt: number;
	ausstellungen_gesamt: number;
	einzelausstellungen: number;
	provision_galerie: number;
	provision_andere: number;
	instagram_follower: number;
	hauptkanal: string;
	social_media: string;
	arbeitsweise: string;
	zusammenarbeit: string;
	nebeneinkommen: string;
}

type Archetype = {
	count: number;
	ausstellungen: number;
	auftraege: number;
	online: number;
	familie: number;
	foerderungen: number;
	atelierkosten: number;
	materialkosten: number;
	werke: number;
	preisMin: number;
	preisMax: number;
	ausstellungenKarriere: number;
	einzelRatio: number;
	provisionGalerie: number;
	provisionAndere: number;
	follower: number;
	hauptkanal: string[];
	socialMedia: string[];
	arbeitsweise: string[];
	zusammenarbeit: string[];
	nebeneinkommen: string[];
};

const ARCHETYPES: Archetype[] = [
	// Gallery stars — established, high prices
	{ count: 3, ausstellungen: 60000, auftraege: 15000, online: 3000, familie: 0, foerderungen: 5000, atelierkosten: 2200, materialkosten: 6000, werke: 12, preisMin: 2500, preisMax: 18000, ausstellungenKarriere: 45, einzelRatio: 0.27, provisionGalerie: 50, provisionAndere: 15, follower: 8000, hauptkanal: ['Galerie'], socialMedia: ['Instagram', 'Instagram', 'LinkedIn'], arbeitsweise: ['Allein', 'Mit Assistent:in(nen)'], zusammenarbeit: ['Selten (1–2× im Jahr)'], nebeneinkommen: ['Nein, lebe nur von der Kunst'] },
	// Mid-career established
	{ count: 3, ausstellungen: 18000, auftraege: 10000, online: 4000, familie: 3000, foerderungen: 8000, atelierkosten: 1200, materialkosten: 3500, werke: 18, preisMin: 600, preisMax: 5000, ausstellungenKarriere: 28, einzelRatio: 0.21, provisionGalerie: 45, provisionAndere: 20, follower: 3500, hauptkanal: ['Galerie', 'Galerie', 'Kunstmessen'], socialMedia: ['Instagram'], arbeitsweise: ['Allein'], zusammenarbeit: ['Selten (1–2× im Jahr)', 'Regelmäßig (monatlich)'], nebeneinkommen: ['Nein, lebe nur von der Kunst', 'Ja, unter 500 €/Monat'] },
	// Emerging artists
	{ count: 3, ausstellungen: 3000, auftraege: 2000, online: 1500, familie: 8000, foerderungen: 6000, atelierkosten: 700, materialkosten: 2000, werke: 8, preisMin: 200, preisMax: 1800, ausstellungenKarriere: 7, einzelRatio: 0.14, provisionGalerie: 40, provisionAndere: 15, follower: 1800, hauptkanal: ['Galerie', 'Direkt aus dem Atelier'], socialMedia: ['Instagram'], arbeitsweise: ['Allein'], zusammenarbeit: ['Selten (1–2× im Jahr)', 'Regelmäßig (monatlich)'], nebeneinkommen: ['Ja, 500–1500 €/Monat', 'Ja, über 1500 €/Monat'] },
	// Social media artists — high volume, low prices
	{ count: 3, ausstellungen: 5000, auftraege: 8000, online: 25000, familie: 0, foerderungen: 2000, atelierkosten: 900, materialkosten: 4000, werke: 85, preisMin: 50, preisMax: 1200, ausstellungenKarriere: 5, einzelRatio: 0.2, provisionGalerie: 0, provisionAndere: 12, follower: 45000, hauptkanal: ['Eigene Website', 'Online-Plattform (Etsy, Artsy …)'], socialMedia: ['Instagram', 'TikTok', 'TikTok'], arbeitsweise: ['Allein', 'Mit Assistent:in(nen)'], zusammenarbeit: ['Nie'], nebeneinkommen: ['Nein, lebe nur von der Kunst', 'Ja, unter 500 €/Monat'] },
	// Grant-dependent
	{ count: 3, ausstellungen: 4000, auftraege: 2000, online: 500, familie: 4000, foerderungen: 18000, atelierkosten: 1100, materialkosten: 3000, werke: 4, preisMin: 800, preisMax: 3500, ausstellungenKarriere: 18, einzelRatio: 0.22, provisionGalerie: 40, provisionAndere: 10, follower: 2200, hauptkanal: ['Galerie', 'Kunstmessen'], socialMedia: ['Instagram', 'LinkedIn'], arbeitsweise: ['Allein'], zusammenarbeit: ['Regelmäßig (monatlich)'], nebeneinkommen: ['Ja, unter 500 €/Monat', 'Ja, 500–1500 €/Monat'] },
	// Part-time/hobby artists
	{ count: 3, ausstellungen: 1500, auftraege: 1000, online: 800, familie: 0, foerderungen: 500, atelierkosten: 400, materialkosten: 1200, werke: 5, preisMin: 100, preisMax: 800, ausstellungenKarriere: 4, einzelRatio: 0, provisionGalerie: 0, provisionAndere: 10, follower: 600, hauptkanal: ['Direkt aus dem Atelier', 'Online-Plattform (Etsy, Artsy …)'], socialMedia: ['Instagram', 'Keine', 'Keine'], arbeitsweise: ['Allein'], zusammenarbeit: ['Nie'], nebeneinkommen: ['Ja, über 1500 €/Monat'] },
	// Commercial/commission artists
	{ count: 3, ausstellungen: 10000, auftraege: 40000, online: 8000, familie: 0, foerderungen: 0, atelierkosten: 2800, materialkosten: 8000, werke: 30, preisMin: 1000, preisMax: 8000, ausstellungenKarriere: 15, einzelRatio: 0.2, provisionGalerie: 35, provisionAndere: 10, follower: 5500, hauptkanal: ['Direkt aus dem Atelier', 'Eigene Website'], socialMedia: ['Instagram', 'LinkedIn'], arbeitsweise: ['Mit Assistent:in(nen)'], zusammenarbeit: ['Selten (1–2× im Jahr)'], nebeneinkommen: ['Nein, lebe nur von der Kunst'] },
	// Struggling artists
	{ count: 3, ausstellungen: 500, auftraege: 800, online: 300, familie: 15000, foerderungen: 2000, atelierkosten: 500, materialkosten: 1500, werke: 3, preisMin: 80, preisMax: 600, ausstellungenKarriere: 3, einzelRatio: 0, provisionGalerie: 0, provisionAndere: 15, follower: 400, hauptkanal: ['Direkt aus dem Atelier', 'Online-Plattform (Etsy, Artsy …)'], socialMedia: ['Instagram', 'TikTok', 'Keine'], arbeitsweise: ['Allein'], zusammenarbeit: ['Nie', 'Selten (1–2× im Jahr)'], nebeneinkommen: ['Ja, 500–1500 €/Monat', 'Ja, über 1500 €/Monat'] },
	// Print/volume sellers
	{ count: 3, ausstellungen: 2000, auftraege: 3000, online: 20000, familie: 0, foerderungen: 0, atelierkosten: 600, materialkosten: 3500, werke: 150, preisMin: 25, preisMax: 400, ausstellungenKarriere: 3, einzelRatio: 0, provisionGalerie: 0, provisionAndere: 18, follower: 22000, hauptkanal: ['Online-Plattform (Etsy, Artsy …)', 'Eigene Website'], socialMedia: ['Instagram', 'TikTok'], arbeitsweise: ['Allein'], zusammenarbeit: ['Nie'], nebeneinkommen: ['Nein, lebe nur von der Kunst', 'Ja, unter 500 €/Monat'] },
	// Collective/team artists
	{ count: 3, ausstellungen: 8000, auftraege: 5000, online: 2000, familie: 5000, foerderungen: 10000, atelierkosten: 800, materialkosten: 2500, werke: 10, preisMin: 300, preisMax: 2500, ausstellungenKarriere: 20, einzelRatio: 0.1, provisionGalerie: 40, provisionAndere: 10, follower: 3000, hauptkanal: ['Galerie', 'Kunstmessen'], socialMedia: ['Instagram'], arbeitsweise: ['Im Kollektiv/Team'], zusammenarbeit: ['Hauptsächlich im Team'], nebeneinkommen: ['Ja, unter 500 €/Monat', 'Ja, 500–1500 €/Monat'] }
];

function buildProfile(archetype: Archetype): ArtistProfile {
	const ausstellungen = jitter(archetype.ausstellungen, 0.25);
	const auftraege = jitter(archetype.auftraege, 0.3);
	const online = jitter(archetype.online, 0.35);
	const gesamt = ausstellungen + auftraege + online;

	const preisMax = jitter(archetype.preisMax, 0.25);
	const preisMin = Math.min(jitter(archetype.preisMin, 0.25), Math.round(preisMax * 0.3));
	const werke = Math.max(1, jitter(archetype.werke, 0.3));
	const preisAvg = werke > 0 ? Math.round(gesamt / werke) : Math.round((preisMin + preisMax) / 2);

	const ausstellungenGesamt = Math.max(1, jitter(archetype.ausstellungenKarriere, 0.2));
	const einzelausstellungen = Math.round(ausstellungenGesamt * archetype.einzelRatio);

	return {
		einkommen_gesamt: gesamt,
		einkommen_ausstellungen: ausstellungen,
		einkommen_auftraege: auftraege,
		einkommen_online: online,
		unterstuetzung_familie: jitter(archetype.familie, 0.3),
		foerderungen: jitter(archetype.foerderungen, 0.35),
		ausgaben_gesamt: jitter(archetype.atelierkosten, 0.2),
		ausgaben_material: jitter(archetype.materialkosten, 0.25),
		werke_verkauft: werke,
		preis_max: preisMax,
		preis_min: preisMin,
		preis_durchschnitt: Math.min(preisAvg, preisMax),
		ausstellungen_gesamt: ausstellungenGesamt,
		einzelausstellungen,
		provision_galerie: archetype.provisionGalerie > 0 ? jitter(archetype.provisionGalerie, 0.1) : 0,
		provision_andere: archetype.provisionAndere > 0 ? jitter(archetype.provisionAndere, 0.2) : 0,
		instagram_follower: jitter(archetype.follower, 0.3),
		hauptkanal: pick(archetype.hauptkanal),
		social_media: pick(archetype.socialMedia),
		arbeitsweise: pick(archetype.arbeitsweise),
		zusammenarbeit: pick(archetype.zusammenarbeit),
		nebeneinkommen: pick(archetype.nebeneinkommen)
	};
}

function generateProfiles(): ArtistProfile[] {
	return ARCHETYPES.flatMap((archetype) =>
		Array.from({ length: archetype.count }, () => buildProfile(archetype))
	);
}

function clampAnswer(questionId: string, value: number): number {
	const question = surveyConfig.questions.find((q) => q.id === questionId);
	if (question?.type === 'range' && question.range) {
		return Math.max(question.range.min, Math.min(question.range.max, Math.round(value)));
	}
	return Math.round(value);
}

async function main() {
	console.log('--- Sotto Seed: Wirtschaftliche Lage bildender Künstler:innen ---\n');

	const profiles = generateProfiles();

	// 1. Create group
	const memberData = Array.from({ length: MEMBER_COUNT }, (_, index) => ({
		name: `Künstler:in ${index + 1}`,
		email: `artist${index + 1}@sotto-demo.local`
	}));

	console.log(`Erstelle Gruppe mit ${MEMBER_COUNT} Künstler:innen …`);
	const [group] = await identityDb.insert(groups).values({ name: 'Bildende Künstler:innen Wien' }).returning();
	await identityDb.insert(groupMembers).values(
		memberData.map((member) => ({ groupId: group.id, name: member.name, email: member.email }))
	);

	// 2. Create survey
	console.log('Erstelle Umfrage …');
	const [survey] = await answerDb
		.insert(surveys)
		.values({
			title: 'Wirtschaftliche Lage bildender Künstler:innen 2026',
			config: surveyConfig,
			status: 'open'
		})
		.returning();

	const keyPair = await suite.generateKey({
		modulusLength: 2048,
		publicExponent: new Uint8Array([0x01, 0x00, 0x01])
	});
	const [pkcs8, spki] = await Promise.all([
		crypto.subtle.exportKey('pkcs8', keyPair.privateKey),
		crypto.subtle.exportKey('spki', keyPair.publicKey)
	]);
	const privateKeyBase64 = toBase64(new Uint8Array(pkcs8));
	const publicKeyBase64 = toBase64(new Uint8Array(spki));

	await answerDb.insert(surveyPublicKeys).values({ surveyId: survey.id, publicKey: publicKeyBase64 });
	await identityDb.insert(surveyCreators).values({ surveyId: survey.id, creator: 'admin' });
	await identityDb.insert(surveySigningKeys).values({ surveyId: survey.id, privateKey: privateKeyBase64 });
	console.log(`  Umfrage: ${survey.id}`);

	// 3. Create invitations
	const invitationRows = await identityDb.insert(invitations).values(
		memberData.map((member) => ({
			surveyId: survey.id,
			email: member.email,
			token: `${randomUUID()}.${randomBytes(32).toString('hex')}`
		}))
	).returning();

	// 4. Submit responses via blind RSA flow
	console.log(`\nSende ${MEMBER_COUNT} anonyme Antworten …\n`);

	const { privateKey, publicKey } = keyPair;

	for (let index = 0; index < invitationRows.length; index++) {
		const invitation = invitationRows[index];
		const profile = profiles[index];
		const label = `  [${index + 1}/${MEMBER_COUNT}]`;

		// Redeem invitation
		await identityDb.update(invitations).set({ redeemed: true }).where(eq(invitations.id, invitation.id));
		await identityDb.insert(users).values({ email: invitation.email }).onConflictDoNothing();
		const [user] = await identityDb.select().from(users).where(eq(users.email, invitation.email));
		await identityDb.insert(signingGrants).values({ userId: user.id, surveyId: survey.id }).onConflictDoNothing();

		// Blind RSA flow
		const message = crypto.getRandomValues(new Uint8Array(32));
		const { blindedMsg, inv } = await suite.blind(publicKey, message);
		const blindSig = await suite.blindSign(privateKey, blindedMsg);
		const signature = await suite.finalize(publicKey, message, blindSig, inv);
		const valid = await suite.verify(publicKey, signature, message);
		if (!valid) {
			console.log(`${label} Signatur fehlgeschlagen, übersprungen`);
			continue;
		}

		// Build answer object from profile
		const answers: Record<string, unknown> = {};
		for (const question of surveyConfig.questions) {
			const value = (profile as Record<string, unknown>)[question.id];
			if (question.type === 'range' && typeof value === 'number') {
				answers[question.id] = clampAnswer(question.id, value);
			} else {
				answers[question.id] = value;
			}
		}

		// Store anonymous response
		const signatureHash = createHash('sha256').update(signature).digest('hex');
		await answerDb.transaction(async (transaction) => {
			await transaction.insert(usedSignatures).values({ signatureHash, surveyId: survey.id });
			await transaction.insert(responses).values({
				surveyId: survey.id,
				blindSignature: toBase64(signature),
				answers
			});
		});

		console.log(`${label} ✓`);
	}

	console.log('\n--- Fertig ---');
	console.log(`\nUmfrage-ID: ${survey.id}`);
	console.log(`Ergebnisse: http://localhost:5173/survey/${survey.id}/results`);
	console.log(`Admin:      http://localhost:5173/admin/surveys/${survey.id}`);
	console.log(`\nNächster Schritt: Survey freezeen mit:`);
	console.log(`  curl -s -X POST "http://localhost:5173/api/admin/surveys/${survey.id}/freeze" -H "Authorization: Bearer sotto-admin-dev"`);

	await identitySql.end();
	await answerSql.end();
}

main().catch(async (error) => {
	console.error('Fehler:', error);
	await identitySql.end();
	await answerSql.end();
	process.exit(1);
});
