import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const url = process.env.ANSWER_DB_URL;
if (!url) throw new Error('ANSWER_DB_URL is not set');

const client = postgres(url, { max: 1 });
await migrate(drizzle(client), { migrationsFolder: './drizzle/answer-migrations' });
await client.end();
