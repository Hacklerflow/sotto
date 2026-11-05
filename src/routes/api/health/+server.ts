import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { answerDb } from '../../../lib/server/answer-db';
import { identityDb } from '../../../lib/server/identity-db';
import { sql } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
	const checks: Record<string, 'ok' | 'error'> = {};
	try {
		await identityDb.execute(sql`SELECT 1`);
		checks.identityDb = 'ok';
	} catch {
		checks.identityDb = 'error';
	}
	try {
		await answerDb.execute(sql`SELECT 1`);
		checks.answerDb = 'ok';
	} catch {
		checks.answerDb = 'error';
	}
	const healthy = Object.values(checks).every((status) => status === 'ok');
	return json({ status: healthy ? 'healthy' : 'degraded', checks }, { status: healthy ? 200 : 503 });
};
