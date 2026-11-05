import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createSession } from '../../../lib/server/auth';
import { getInvitationInfo, redeemInvitation } from '../../../lib/server/invitations';

const MESSAGE_ALREADY_REDEEMED = 'Diese Einladung wurde bereits verwendet.';
const MESSAGE_INVALID = 'Ungültiger oder abgelaufener Einladungslink.';
const MESSAGE_GENERIC = 'Etwas ist schiefgelaufen.';

function toUserMessage(cause: unknown): string {
	if (cause instanceof Error) {
		if (cause.message === 'Invitation already redeemed') return MESSAGE_ALREADY_REDEEMED;
		if (cause.message === 'Invalid invitation') return MESSAGE_INVALID;
	}
	return MESSAGE_GENERIC;
}

export const load: PageServerLoad = async ({ params }) => {
	try {
		const info = await getInvitationInfo(params.token);
		if (info.status === 'redeemed')
			return { valid: false, error: MESSAGE_ALREADY_REDEEMED, surveyTitle: info.surveyTitle };
		if (info.status === 'unknown')
			return { valid: false, error: MESSAGE_INVALID, surveyTitle: null };
		return { valid: true, error: null, surveyTitle: info.surveyTitle };
	} catch {
		return { valid: false, error: MESSAGE_GENERIC, surveyTitle: null };
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
