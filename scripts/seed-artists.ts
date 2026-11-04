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

function generateProfiles(): ArtistProfile[] {
	const profiles: ArtistProfile[] = [];

	// 1-3: Gallery stars — established, high prices, major exhibitions
	for (let i = 0; i < 3; i++) {
		profiles.push({
			einkommen_gesamt: jitter(85000, 0.3),
			einkommen_ausstellungen: jitter(60000, 0.3),
			einkommen_auftraege: jitter(15000, 0.4),
			einkommen_online: jitter(3000, 0.5),
			unterstuetzung_familie: 0,
			foerderungen: jitter(5000, 0.6),
			ausgaben_gesamt: jitter(2200, 0.2),
			ausgaben_material: jitter(6000, 0.3),
			werke_verkauft: jitter(12, 0.3),
			preis_max: jitter(18000, 0.4),
			preis_min: jitter(2500, 0.3),
			preis_durchschnitt: jitter(7000, 0.3),
			ausstellungen_gesamt: jitter(45, 0.2),
			einzelausstellungen: jitter(12, 0.3),
			provision_galerie: jitter(50, 0.1),
			provision_andere: jitter(15, 0.3),
			instagram_follower: jitter(8000, 0.4),
			hauptkanal: 'Galerie',
			social_media: pick(['Instagram', 'Instagram', 'LinkedIn']),
			arbeitsweise: pick(['Allein', 'Mit Assistent:in(nen)']),
			zusammenarbeit: 'Selten (1–2× im Jahr)',
			nebeneinkommen: 'Nein, lebe nur von der Kunst'
		});
	}

	// 4-6: Mid-career established — steady, moderate income
	for (let i = 0; i < 3; i++) {
		profiles.push({
			einkommen_gesamt: jitter(35000, 0.3),
			einkommen_ausstellungen: jitter(18000, 0.3),
			einkommen_auftraege: jitter(10000, 0.4),
			einkommen_online: jitter(4000, 0.5),
			unterstuetzung_familie: jitter(3000, 0.5),
			foerderungen: jitter(8000, 0.4),
			ausgaben_gesamt: jitter(1200, 0.25),
			ausgaben_material: jitter(3500, 0.3),
			werke_verkauft: jitter(18, 0.3),
			preis_max: jitter(5000, 0.4),
			preis_min: jitter(600, 0.3),
			preis_durchschnitt: jitter(2000, 0.3),
			ausstellungen_gesamt: jitter(28, 0.2),
			einzelausstellungen: jitter(6, 0.3),
			provision_galerie: jitter(45, 0.1),
			provision_andere: jitter(20, 0.3),
			instagram_follower: jitter(3500, 0.4),
			hauptkanal: pick(['Galerie', 'Galerie', 'Kunstmessen']),
			social_media: 'Instagram',
			arbeitsweise: 'Allein',
			zusammenarbeit: pick(['Selten (1–2× im Jahr)', 'Regelmäßig (monatlich)']),
			nebeneinkommen: pick(['Nein, lebe nur von der Kunst', 'Ja, unter 500 €/Monat'])
		});
	}

	// 7-9: Emerging artists — few exhibitions, some grants, low prices
	for (let i = 0; i < 3; i++) {
		profiles.push({
			einkommen_gesamt: jitter(9000, 0.4),
			einkommen_ausstellungen: jitter(3000, 0.5),
			einkommen_auftraege: jitter(2000, 0.5),
			einkommen_online: jitter(1500, 0.5),
			unterstuetzung_familie: jitter(8000, 0.4),
			foerderungen: jitter(6000, 0.4),
			ausgaben_gesamt: jitter(700, 0.3),
			ausgaben_material: jitter(2000, 0.3),
			werke_verkauft: jitter(8, 0.4),
			preis_max: jitter(1800, 0.4),
			preis_min: jitter(200, 0.4),
			preis_durchschnitt: jitter(700, 0.3),
			ausstellungen_gesamt: jitter(7, 0.4),
			einzelausstellungen: jitter(1, 0.5),
			provision_galerie: jitter(40, 0.15),
			provision_andere: jitter(15, 0.4),
			instagram_follower: jitter(1800, 0.5),
			hauptkanal: pick(['Galerie', 'Direkt aus dem Atelier']),
			social_media: 'Instagram',
			arbeitsweise: 'Allein',
			zusammenarbeit: pick(['Selten (1–2× im Jahr)', 'Regelmäßig (monatlich)']),
			nebeneinkommen: pick(['Ja, 500–1500 €/Monat', 'Ja, über 1500 €/Monat'])
		});
	}

	// 10-12: Social media artists — huge following, direct sales, lower prices, high volume
	for (let i = 0; i < 3; i++) {
		profiles.push({
			einkommen_gesamt: jitter(42000, 0.3),
			einkommen_ausstellungen: jitter(5000, 0.5),
			einkommen_auftraege: jitter(8000, 0.4),
			einkommen_online: jitter(25000, 0.3),
			unterstuetzung_familie: 0,
			foerderungen: jitter(2000, 0.6),
			ausgaben_gesamt: jitter(900, 0.3),
			ausgaben_material: jitter(4000, 0.3),
			werke_verkauft: jitter(85, 0.3),
			preis_max: jitter(1200, 0.4),
			preis_min: jitter(50, 0.4),
			preis_durchschnitt: jitter(350, 0.3),
			ausstellungen_gesamt: jitter(5, 0.5),
			einzelausstellungen: jitter(1, 0.8),
			provision_galerie: 0,
			provision_andere: jitter(12, 0.3),
			instagram_follower: jitter(45000, 0.4),
			hauptkanal: pick(['Eigene Website', 'Online-Plattform (Etsy, Artsy …)']),
			social_media: pick(['Instagram', 'TikTok', 'TikTok']),
			arbeitsweise: pick(['Allein', 'Mit Assistent:in(nen)']),
			zusammenarbeit: 'Nie',
			nebeneinkommen: pick(['Nein, lebe nur von der Kunst', 'Ja, unter 500 €/Monat'])
		});
	}

	// 13-15: Grant-dependent — lots of Förderungen, institutional, few commercial sales
	for (let i = 0; i < 3; i++) {
		profiles.push({
			einkommen_gesamt: jitter(22000, 0.3),
			einkommen_ausstellungen: jitter(4000, 0.5),
			einkommen_auftraege: jitter(2000, 0.5),
			einkommen_online: jitter(500, 0.6),
			unterstuetzung_familie: jitter(4000, 0.4),
			foerderungen: jitter(18000, 0.3),
			ausgaben_gesamt: jitter(1100, 0.25),
			ausgaben_material: jitter(3000, 0.3),
			werke_verkauft: jitter(4, 0.5),
			preis_max: jitter(3500, 0.4),
			preis_min: jitter(800, 0.4),
			preis_durchschnitt: jitter(2000, 0.3),
			ausstellungen_gesamt: jitter(18, 0.3),
			einzelausstellungen: jitter(4, 0.4),
			provision_galerie: jitter(40, 0.2),
			provision_andere: jitter(10, 0.5),
			instagram_follower: jitter(2200, 0.4),
			hauptkanal: pick(['Galerie', 'Kunstmessen']),
			social_media: pick(['Instagram', 'LinkedIn']),
			arbeitsweise: 'Allein',
			zusammenarbeit: 'Regelmäßig (monatlich)',
			nebeneinkommen: pick(['Ja, unter 500 €/Monat', 'Ja, 500–1500 €/Monat'])
		});
	}

	// 16-18: Part-time/hobby artists — other main income, art is side
	for (let i = 0; i < 3; i++) {
		profiles.push({
			einkommen_gesamt: jitter(4000, 0.5),
			einkommen_ausstellungen: jitter(1500, 0.6),
			einkommen_auftraege: jitter(1000, 0.6),
			einkommen_online: jitter(800, 0.6),
			unterstuetzung_familie: 0,
			foerderungen: jitter(500, 0.8),
			ausgaben_gesamt: jitter(400, 0.3),
			ausgaben_material: jitter(1200, 0.4),
			werke_verkauft: jitter(5, 0.5),
			preis_max: jitter(800, 0.5),
			preis_min: jitter(100, 0.5),
			preis_durchschnitt: jitter(400, 0.4),
			ausstellungen_gesamt: jitter(4, 0.5),
			einzelausstellungen: 0,
			provision_galerie: 0,
			provision_andere: jitter(10, 0.5),
			instagram_follower: jitter(600, 0.5),
			hauptkanal: pick(['Direkt aus dem Atelier', 'Online-Plattform (Etsy, Artsy …)']),
			social_media: pick(['Instagram', 'Keine', 'Keine']),
			arbeitsweise: 'Allein',
			zusammenarbeit: 'Nie',
			nebeneinkommen: 'Ja, über 1500 €/Monat'
		});
	}

	// 19-21: Commercial/commission artists — high output, assistants
	for (let i = 0; i < 3; i++) {
		profiles.push({
			einkommen_gesamt: jitter(65000, 0.25),
			einkommen_ausstellungen: jitter(10000, 0.4),
			einkommen_auftraege: jitter(40000, 0.25),
			einkommen_online: jitter(8000, 0.4),
			unterstuetzung_familie: 0,
			foerderungen: 0,
			ausgaben_gesamt: jitter(2800, 0.2),
			ausgaben_material: jitter(8000, 0.3),
			werke_verkauft: jitter(30, 0.3),
			preis_max: jitter(8000, 0.3),
			preis_min: jitter(1000, 0.3),
			preis_durchschnitt: jitter(3000, 0.25),
			ausstellungen_gesamt: jitter(15, 0.3),
			einzelausstellungen: jitter(3, 0.4),
			provision_galerie: jitter(35, 0.2),
			provision_andere: jitter(10, 0.4),
			instagram_follower: jitter(5500, 0.4),
			hauptkanal: pick(['Direkt aus dem Atelier', 'Eigene Website']),
			social_media: pick(['Instagram', 'LinkedIn']),
			arbeitsweise: 'Mit Assistent:in(nen)',
			zusammenarbeit: 'Selten (1–2× im Jahr)',
			nebeneinkommen: 'Nein, lebe nur von der Kunst'
		});
	}

	// 22-24: Struggling artists — very low income, lots of support needed
	for (let i = 0; i < 3; i++) {
		profiles.push({
			einkommen_gesamt: jitter(2500, 0.5),
			einkommen_ausstellungen: jitter(500, 0.7),
			einkommen_auftraege: jitter(800, 0.6),
			einkommen_online: jitter(300, 0.7),
			unterstuetzung_familie: jitter(15000, 0.3),
			foerderungen: jitter(2000, 0.6),
			ausgaben_gesamt: jitter(500, 0.3),
			ausgaben_material: jitter(1500, 0.4),
			werke_verkauft: jitter(3, 0.6),
			preis_max: jitter(600, 0.5),
			preis_min: jitter(80, 0.5),
			preis_durchschnitt: jitter(300, 0.4),
			ausstellungen_gesamt: jitter(3, 0.5),
			einzelausstellungen: 0,
			provision_galerie: 0,
			provision_andere: jitter(15, 0.5),
			instagram_follower: jitter(400, 0.6),
			hauptkanal: pick(['Direkt aus dem Atelier', 'Online-Plattform (Etsy, Artsy …)']),
			social_media: pick(['Instagram', 'TikTok', 'Keine']),
			arbeitsweise: 'Allein',
			zusammenarbeit: pick(['Nie', 'Selten (1–2× im Jahr)']),
			nebeneinkommen: pick(['Ja, 500–1500 €/Monat', 'Ja, über 1500 €/Monat'])
		});
	}

	// 25-27: Print/volume sellers — many cheap works, mostly online
	for (let i = 0; i < 3; i++) {
		profiles.push({
			einkommen_gesamt: jitter(28000, 0.3),
			einkommen_ausstellungen: jitter(2000, 0.5),
			einkommen_auftraege: jitter(3000, 0.5),
			einkommen_online: jitter(20000, 0.3),
			unterstuetzung_familie: 0,
			foerderungen: 0,
			ausgaben_gesamt: jitter(600, 0.3),
			ausgaben_material: jitter(3500, 0.3),
			werke_verkauft: jitter(150, 0.25),
			preis_max: jitter(400, 0.4),
			preis_min: jitter(25, 0.4),
			preis_durchschnitt: jitter(150, 0.3),
			ausstellungen_gesamt: jitter(3, 0.5),
			einzelausstellungen: 0,
			provision_galerie: 0,
			provision_andere: jitter(18, 0.3),
			instagram_follower: jitter(22000, 0.4),
			hauptkanal: pick(['Online-Plattform (Etsy, Artsy …)', 'Eigene Website']),
			social_media: pick(['Instagram', 'TikTok']),
			arbeitsweise: 'Allein',
			zusammenarbeit: 'Nie',
			nebeneinkommen: pick(['Nein, lebe nur von der Kunst', 'Ja, unter 500 €/Monat'])
		});
	}

	// 28-30: Collective/team artists — shared exhibitions, moderate income, collaborative
	for (let i = 0; i < 3; i++) {
		profiles.push({
			einkommen_gesamt: jitter(18000, 0.3),
			einkommen_ausstellungen: jitter(8000, 0.4),
			einkommen_auftraege: jitter(5000, 0.4),
			einkommen_online: jitter(2000, 0.5),
			unterstuetzung_familie: jitter(5000, 0.5),
			foerderungen: jitter(10000, 0.3),
			ausgaben_gesamt: jitter(800, 0.3),
			ausgaben_material: jitter(2500, 0.3),
			werke_verkauft: jitter(10, 0.4),
			preis_max: jitter(2500, 0.4),
			preis_min: jitter(300, 0.4),
			preis_durchschnitt: jitter(1200, 0.3),
			ausstellungen_gesamt: jitter(20, 0.3),
			einzelausstellungen: jitter(2, 0.5),
			provision_galerie: jitter(40, 0.2),
			provision_andere: jitter(10, 0.5),
			instagram_follower: jitter(3000, 0.5),
			hauptkanal: pick(['Galerie', 'Kunstmessen']),
			social_media: 'Instagram',
			arbeitsweise: 'Im Kollektiv/Team',
			zusammenarbeit: 'Hauptsächlich im Team',
			nebeneinkommen: pick(['Ja, unter 500 €/Monat', 'Ja, 500–1500 €/Monat'])
		});
	}

	return profiles;
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
