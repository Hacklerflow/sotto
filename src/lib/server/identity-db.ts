import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../../drizzle/identity-schema';

const url = process.env.IDENTITY_DB_URL;
if (!url) throw new Error('IDENTITY_DB_URL is not set');

export const identityDb = drizzle(postgres(url), { schema });
