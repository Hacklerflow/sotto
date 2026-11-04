import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	dialect: 'postgresql',
	schema: './drizzle/identity-schema.ts',
	out: './drizzle/identity-migrations',
	dbCredentials: {
		url: process.env.IDENTITY_DB_URL ?? 'postgres://sotto:sotto-dev@localhost:5433/sotto_identity'
	}
});
