import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

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
