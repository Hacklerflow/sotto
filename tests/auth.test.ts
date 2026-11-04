import { afterAll, expect, test } from 'vitest';
import type { Cookies } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { answerDb } from '../src/lib/server/answer-db';
import { identityDb } from '../src/lib/server/identity-db';
import {
	SESSION_COOKIE,
	createSession,
	destroySession,
	getSession,
	isAdminRequest
} from '../src/lib/server/auth';
import { sessions, users } from '../drizzle/identity-schema';

type SetCall = { name: string; value: string; options: Record<string, unknown> };

function fakeCookies(initial: Record<string, string> = {}) {
	const store = new Map(Object.entries(initial));
	const setCalls: SetCall[] = [];
	const cookies = {
		get: (name: string) => store.get(name),
		set: (name: string, value: string, options: Record<string, unknown>) => {
			store.set(name, value);
			setCalls.push({ name, value, options });
		},
		delete: (name: string) => {
			store.delete(name);
		}
	} as unknown as Cookies;
	return { cookies, setCalls, store };
}

async function createUser(): Promise<string> {
	const [user] = await identityDb
		.insert(users)
		.values({ email: `auth-${crypto.randomUUID()}@test.com` })
		.returning();
	return user.id;
}

afterAll(async () => {
	await identityDb.$client.end();
	await answerDb.$client.end();
});

test('createSession sets a hardened cookie and stores only a hash', async () => {
	const userId = await createUser();
	const { cookies, setCalls, store } = fakeCookies();
	await createSession(userId, cookies);
	expect(setCalls[0].name).toBe(SESSION_COOKIE);
	expect(setCalls[0].options).toMatchObject({ httpOnly: true, secure: true, sameSite: 'strict' });
	const rows = await identityDb.select().from(sessions).where(eq(sessions.userId, userId));
	expect(rows).toHaveLength(1);
	expect(rows[0].tokenHash).not.toBe(store.get(SESSION_COOKIE));
});

test('getSession returns the user for a valid cookie', async () => {
	const userId = await createUser();
	const { cookies } = fakeCookies();
	await createSession(userId, cookies);
	expect((await getSession(cookies))?.userId).toBe(userId);
});

test('getSession returns null without cookie or with unknown token', async () => {
	expect(await getSession(fakeCookies().cookies)).toBeNull();
	expect(await getSession(fakeCookies({ [SESSION_COOKIE]: 'bogus' }).cookies)).toBeNull();
});

test('getSession returns null for expired sessions', async () => {
	const userId = await createUser();
	const { cookies } = fakeCookies();
	await createSession(userId, cookies);
	await identityDb
		.update(sessions)
		.set({ expiresAt: new Date(Date.now() - 1000) })
		.where(eq(sessions.userId, userId));
	expect(await getSession(cookies)).toBeNull();
});

test('destroySession invalidates the session', async () => {
	const userId = await createUser();
	const { cookies } = fakeCookies();
	await createSession(userId, cookies);
	const token = cookies.get(SESSION_COOKIE) as string;
	await destroySession(cookies);
	expect(await getSession(fakeCookies({ [SESSION_COOKIE]: token }).cookies)).toBeNull();
});

test('isAdminRequest checks the shared secret', () => {
	const original = process.env.ADMIN_SECRET;
	process.env.ADMIN_SECRET = 'test-secret';
	const withHeader = (value?: string) =>
		new Request('http://localhost', value ? { headers: { authorization: value } } : {});
	expect(isAdminRequest(withHeader('Bearer test-secret'))).toBe(true);
	expect(isAdminRequest(withHeader('Bearer wrong'))).toBe(false);
	expect(isAdminRequest(withHeader())).toBe(false);
	delete process.env.ADMIN_SECRET;
	expect(isAdminRequest(withHeader('Bearer '))).toBe(false);
	if (original !== undefined) process.env.ADMIN_SECRET = original;
});
