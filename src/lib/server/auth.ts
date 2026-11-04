import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { and, eq, gt } from 'drizzle-orm';
import { identityDb } from './identity-db';
import { sessions, users } from '../../../drizzle/identity-schema';

export const SESSION_COOKIE = 'sotto_session';
const SESSION_LIFETIME_S = 60 * 60 * 24 * 7;

export type Session = { userId: string; email: string };

function hashToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: string, cookies: Cookies): Promise<void> {
	const token = randomBytes(32).toString('hex');
	const expiresAt = new Date(Date.now() + SESSION_LIFETIME_S * 1000);
	await identityDb.insert(sessions).values({ userId, tokenHash: hashToken(token), expiresAt });
	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'strict',
		maxAge: SESSION_LIFETIME_S
	});
}

export async function getSession(cookies: Cookies): Promise<Session | null> {
	const token = cookies.get(SESSION_COOKIE);
	if (!token) return null;
	const [row] = await identityDb
		.select({ userId: users.id, email: users.email })
		.from(sessions)
		.innerJoin(users, eq(users.id, sessions.userId))
		.where(and(eq(sessions.tokenHash, hashToken(token)), gt(sessions.expiresAt, new Date())));
	return row ?? null;
}

export async function destroySession(cookies: Cookies): Promise<void> {
	const token = cookies.get(SESSION_COOKIE);
	if (token) await identityDb.delete(sessions).where(eq(sessions.tokenHash, hashToken(token)));
	cookies.delete(SESSION_COOKIE, { path: '/' });
}

// MVP admin auth: shared secret in ADMIN_SECRET, sent as "Authorization: Bearer <secret>".
export function isAdminRequest(request: Request): boolean {
	const secret = process.env.ADMIN_SECRET;
	if (!secret) return false;
	const header = request.headers.get('authorization') ?? '';
	const provided = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : '';
	const expectedHash = createHash('sha256').update(secret).digest();
	const providedHash = createHash('sha256').update(provided).digest();
	return timingSafeEqual(expectedHash, providedHash);
}
