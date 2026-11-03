import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { createSession } from '../../../lib/server/auth';
import { redeemInvitation } from '../../../lib/server/invitations';

export const load: PageServerLoad = async ({ params, cookies }) => {
	let redeemed: { userId: string; surveyId: string };
	try {
		redeemed = await redeemInvitation(params.token);
	} catch (cause) {
		const message = cause instanceof Error ? cause.message : 'Invalid invitation';
		return { error: message };
	}
	await createSession(redeemed.userId, cookies);
	redirect(303, `/survey/${redeemed.surveyId}`);
};
