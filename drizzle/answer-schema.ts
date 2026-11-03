import { boolean, jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core';

// No timestamps, no user references and no ordering columns anywhere in this schema:
// anything that could correlate an answer with a person or a moment must not exist.
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
