import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createSession } from '../../../lib/server/auth';
import { getInvitationStatus, redeemInvitation } from '../../../lib/server/invitations';

const MESSAGE_ALREADY_REDEEMED = 'Invitation already redeemed';
const MESSAGE_INVALID = 'Invalid or expired invitation token';
const MESSAGE_GENERIC = 'Something went wrong';

function toUserMessage(cause: unknown): string {
	if (cause instanceof Error) {
		if (cause.message === 'Invitation already redeemed') return MESSAGE_ALREADY_REDEEMED;
		if (cause.message === 'Invalid invitation') return MESSAGE_INVALID;
	}
	return MESSAGE_GENERIC;
}

export const load: PageServerLoad = async ({ params }) => {
	try {
		const status = await getInvitationStatus(params.token);
		if (status === 'redeemed') return { valid: false, error: MESSAGE_ALREADY_REDEEMED };
		if (status === 'unknown') return { valid: false, error: MESSAGE_INVALID };
		return { valid: true, error: null };
	} catch {
		return { valid: false, error: MESSAGE_GENERIC };
	}
};

export const actions: Actions = {
	default: async ({ params, cookies }) => {
		let redeemed: { userId: string; surveyId: string };
		try {
			redeemed = await redeemInvitation(params.token);
		} catch (cause) {
			return { error: toUserMessage(cause) };
		}
		await createSession(redeemed.userId, cookies);
		redirect(303, `/survey/${redeemed.surveyId}`);
	}
};
