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
