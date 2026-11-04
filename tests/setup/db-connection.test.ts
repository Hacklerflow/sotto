import { afterAll, expect, test } from 'vitest';
import { sql } from 'drizzle-orm';
import { identityDb } from '../../src/lib/server/identity-db';
import { answerDb } from '../../src/lib/server/answer-db';

async function listTables(database: typeof identityDb | typeof answerDb): Promise<string[]> {
	const rows = await database.execute(sql`
		SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
	`);
	return rows.map((row) => String(row.table_name));
}

afterAll(async () => {
	await identityDb.$client.end();
	await answerDb.$client.end();
});

test('identity-db connects and has users table', async () => {
	expect(await identityDb.execute(sql`SELECT 1`)).toBeTruthy();
	expect(await listTables(identityDb)).toEqual(expect.arrayContaining(['users', 'invitations']));
});

test('answer-db connects and has responses table', async () => {
	expect(await answerDb.execute(sql`SELECT 1`)).toBeTruthy();
	expect(await listTables(answerDb)).toEqual(expect.arrayContaining(['surveys', 'responses']));
});

test('answer-db has no foreign keys and no identity tables', async () => {
	const foreignKeys = await answerDb.execute(sql`
		SELECT constraint_name FROM information_schema.table_constraints
		WHERE constraint_type = 'FOREIGN KEY'
	`);
	expect(foreignKeys.length).toBe(0);
	const tables = await listTables(answerDb);
	expect(tables).not.toContain('users');
	expect(tables).not.toContain('invitations');
});
