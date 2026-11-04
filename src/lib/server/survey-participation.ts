import { and, eq } from 'drizzle-orm';
import { answerDb } from './answer-db';
import { identityDb } from './identity-db';
import { surveys } from '../../../drizzle/answer-schema';
import { invitations, signingGrants, users } from '../../../drizzle/identity-schema';
import { validateSurveyConfig, type SurveyConfig } from '../types/survey';

export type SurveyParticipation =
	| { state: 'not-found' }
	| { state: 'closed'; title: string }
	| { state: 'not-invited' }
	| {
			state: 'open';
			title: string;
			config: SurveyConfig;
			// A signature was already issued: the browser may still hold the credential for a retry.
			alreadySigned: boolean;
	  };

export async function loadSurveyParticipation(
	surveyId: string,
	userId: string
): Promise<SurveyParticipation> {
	const [survey] = await answerDb
		.select({ title: surveys.title, config: surveys.config, status: surveys.status })
		.from(surveys)
		.where(eq(surveys.id, surveyId));
	if (!survey) return { state: 'not-found' };

	const [invitation] = await identityDb
		.select({ id: invitations.id })
		.from(invitations)
		.innerJoin(users, eq(users.email, invitations.email))
		.where(
			and(
				eq(users.id, userId),
				eq(invitations.surveyId, surveyId),
				eq(invitations.redeemed, true)
			)
		);
	if (!invitation) return { state: 'not-invited' };
	if (survey.status !== 'open') return { state: 'closed', title: survey.title };

	const [grant] = await identityDb
		.select({ userId: signingGrants.userId })
		.from(signingGrants)
		.where(and(eq(signingGrants.userId, userId), eq(signingGrants.surveyId, surveyId)));

	return {
		state: 'open',
		title: survey.title,
		config: validateSurveyConfig(survey.config),
		alreadySigned: grant !== undefined
	};
}
