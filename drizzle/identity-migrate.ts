import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const url = process.env.IDENTITY_DB_URL;
if (!url) throw new Error('IDENTITY_DB_URL is not set');

const client = postgres(url, { max: 1 });
await migrate(drizzle(client), { migrationsFolder: './drizzle/identity-migrations' });
await client.end();
