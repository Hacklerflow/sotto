import { boolean, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// No timestamps, no user references and no ordering columns on answer tables (only
// result_snapshots is stamped): anything that could correlate an answer with a person or a moment must not exist.
export const surveys = pgTable('surveys', {
	id: uuid('id').primaryKey().defaultRandom(),
	title: text('title').notNull(),
	config: jsonb('config').notNull(),
	status: text('status').notNull(),
	thresholdMet: boolean('threshold_met').notNull().default(false)
});

// surveyId deliberately has no foreign key to keep inserts free of cross-table side effects.
export const responses = pgTable('responses', {
	id: uuid('id').primaryKey().defaultRandom(),
	surveyId: uuid('survey_id').notNull(),
	blindSignature: text('blind_signature').notNull(),
	answers: jsonb('answers').notNull()
});

// Per-survey RSA public key (SPKI, base64), used to verify unblinded signatures.
export const surveyPublicKeys = pgTable('survey_public_keys', {
	surveyId: uuid('survey_id').primaryKey(),
	publicKey: text('public_key').notNull()
});

// SHA-256 hashes of signatures already redeemed; prevents reuse. No timestamps by design.
export const usedSignatures = pgTable('used_signatures', {
	signatureHash: text('signature_hash').primaryKey(),
	surveyId: uuid('survey_id').notNull()
});

// Frozen, aggregated results. frozen_at stamps the publication of results, not any answer.
export const resultSnapshots = pgTable('result_snapshots', {
	id: uuid('id').primaryKey().defaultRandom(),
	surveyId: uuid('survey_id').notNull(),
	frozenAt: timestamp('frozen_at', { withTimezone: true }).notNull().defaultNow(),
	data: jsonb('data').notNull()
});
