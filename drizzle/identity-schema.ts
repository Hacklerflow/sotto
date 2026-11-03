import { boolean, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
	id: uuid('id').primaryKey().defaultRandom(),
	email: text('email').notNull().unique(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

// surveyId deliberately has no foreign key: surveys live in the separate Answer-DB.
export const invitations = pgTable('invitations', {
	id: uuid('id').primaryKey().defaultRandom(),
	surveyId: uuid('survey_id').notNull(),
	email: text('email').notNull(),
	token: text('token').notNull().unique(),
	redeemed: boolean('redeemed').notNull().default(false),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

// Creator association for surveys; surveyId has no foreign key (survey metadata lives in the Answer-DB).
export const surveyCreators = pgTable('survey_creators', {
	surveyId: uuid('survey_id').primaryKey(),
	creator: text('creator').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

// Server-side sessions; only the SHA-256 hash of the cookie token is stored.
export const sessions = pgTable('sessions', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	tokenHash: text('token_hash').notNull().unique(),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull()
});

// Per-survey RSA private key (PKCS#8, base64); only needed to blind-sign. surveyId has no foreign key.
export const surveySigningKeys = pgTable('survey_signing_keys', {
	surveyId: uuid('survey_id').primaryKey(),
	privateKey: text('private_key').notNull()
});

// Records that a user already received a blind signature for a survey (never what was signed).
export const signingGrants = pgTable(
	'signing_grants',
	{
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		surveyId: uuid('survey_id').notNull(),
		grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow()
	},
	(table) => [unique('signing_grants_user_survey_unique').on(table.userId, table.surveyId)]
);
