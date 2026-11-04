import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../../drizzle/answer-schema';

const url = process.env.ANSWER_DB_URL;
if (!url) throw new Error('ANSWER_DB_URL is not set');

export const answerDb = drizzle(postgres(url), { schema });
