import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	dialect: 'postgresql',
	schema: './drizzle/answer-schema.ts',
	out: './drizzle/answer-migrations',
	dbCredentials: {
		url: process.env.ANSWER_DB_URL ?? 'postgres://sotto:sotto-dev@localhost:5434/sotto_answer'
	}
});
