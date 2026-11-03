// @vitest-environment jsdom
import { afterAll, afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/svelte';
import { eq } from 'drizzle-orm';
import SurveyForm from '../src/lib/components/SurveyForm.svelte';
import SubmissionFlow from '../src/lib/components/SubmissionFlow.svelte';
import { answerDb } from '../src/lib/server/answer-db';
import { identityDb } from '../src/lib/server/identity-db';
import { createInvitations, createSurvey, redeemInvitation } from '../src/lib/server/invitations';
import { loadSurveyParticipation } from '../src/lib/server/survey-participation';
import { surveys } from '../drizzle/answer-schema';
import { signingGrants } from '../drizzle/identity-schema';
import type { SurveyConfig } from '../src/lib/types/survey';

const config: SurveyConfig = {
	questions: [
		{ id: 'q1', text: 'Annual income', type: 'number', unit: 'EUR' },
		{ id: 'q2', text: 'Primary channel', type: 'single-choice', options: ['Gallery', 'Online', 'Direct'] },
		{ id: 'q3', text: 'Satisfaction', type: 'range', range: { min: 1, max: 10 } }
	],
	dimensions: [],
	visualizations: []
};

afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
});

afterAll(async () => {
	await identityDb.$client.end();
	await answerDb.$client.end();
});

test('SurveyForm renders all question types', () => {
	const { getAllByRole } = render(SurveyForm, { config });
	expect(getAllByRole('group')).toHaveLength(3);
});

test('submit is disabled until all questions are answered, then passes answers on', async () => {
	const onsubmit = vi.fn();
	const { getByRole } = render(SurveyForm, { config, onsubmit });
	const submit = getByRole('button', { name: 'Anonym absenden' }) as HTMLButtonElement;
	expect(submit.disabled).toBe(true);

	await fireEvent.input(getByRole('spinbutton'), { target: { value: '42000' } });
	await fireEvent.click(getByRole('radio', { name: 'Online' }));
	await fireEvent.input(getByRole('slider'), { target: { value: '7' } });
	expect(submit.disabled).toBe(false);

	await fireEvent.click(submit);
	expect(onsubmit).toHaveBeenCalledWith({ q1: 42000, q2: 'Online', q3: 7 });
});

test('multi-choice collects a list of options', async () => {
	const onsubmit = vi.fn();
	const multi: SurveyConfig = {
		questions: [{ id: 'm', text: 'Pick', type: 'multi-choice', options: ['a', 'b', 'c'] }],
		dimensions: [],
		visualizations: []
	};
	const { getByRole } = render(SurveyForm, { config: multi, onsubmit });
	await fireEvent.click(getByRole('checkbox', { name: 'a' }));
	await fireEvent.click(getByRole('checkbox', { name: 'c' }));
	await fireEvent.click(getByRole('button', { name: 'Anonym absenden' }));
	expect(onsubmit).toHaveBeenCalledWith({ m: ['a', 'c'] });
});

test('SubmissionFlow submits with the blind credential and reaches done', async () => {
	const blind = await import('../src/lib/client/blind-requester');
	const credential = { signature: new Uint8Array([1]), message: new Uint8Array([2]) };
	vi.spyOn(blind, 'requestBlindSignature').mockResolvedValue(credential);
	const submit = vi.spyOn(blind, 'submitAnonymous').mockResolvedValue();
	const { findByText } = render(SubmissionFlow, { surveyId: 's1', answers: { q1: 1 } });
	await findByText(/Erfolgreich abgegeben/);
	expect(submit).toHaveBeenCalledWith('s1', credential.signature, credential.message, { q1: 1 });
});

test('SubmissionFlow retry does not request a second blind signature', async () => {
	const blind = await import('../src/lib/client/blind-requester');
	const credential = { signature: new Uint8Array([1]), message: new Uint8Array([2]) };
	const request = vi.spyOn(blind, 'requestBlindSignature').mockResolvedValue(credential);
	vi.spyOn(blind, 'submitAnonymous')
		.mockRejectedValueOnce(new Error('network'))
		.mockResolvedValueOnce();
	const { findByRole, findByText } = render(SubmissionFlow, { surveyId: 's2', answers: {} });
	await fireEvent.click(await findByRole('button', { name: 'Erneut versuchen' }));
	await findByText(/Erfolgreich abgegeben/);
	await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
});

async function inviteUser(status = 'open') {
	const survey = await createSurvey('Participation', config);
	if (status !== 'open') {
		await answerDb.update(surveys).set({ status }).where(eq(surveys.id, survey.id));
	}
	const [invite] = await createInvitations(survey.id, [`part-${survey.id}@test.com`]);
	const { userId } = await redeemInvitation(invite.token);
	return { surveyId: survey.id, userId };
}

test('load: open survey for invited user, not yet signed', async () => {
	const { surveyId, userId } = await inviteUser();
	const result = await loadSurveyParticipation(surveyId, userId);
	expect(result).toMatchObject({ state: 'open', alreadySigned: false, title: 'Participation' });
});

test('load: reports alreadySigned after a signature was issued', async () => {
	const { surveyId, userId } = await inviteUser();
	await identityDb.insert(signingGrants).values({ userId, surveyId });
	const result = await loadSurveyParticipation(surveyId, userId);
	expect(result).toMatchObject({ state: 'open', alreadySigned: true });
});

test('load: closed survey and uninvited user', async () => {
	const closed = await inviteUser('closed');
	expect((await loadSurveyParticipation(closed.surveyId, closed.userId)).state).toBe('closed');
	const other = await inviteUser();
	expect((await loadSurveyParticipation(closed.surveyId, other.userId)).state).toBe('not-invited');
});

test('load: unknown survey', async () => {
	const { userId } = await inviteUser();
	const result = await loadSurveyParticipation('00000000-0000-4000-8000-000000000000', userId);
	expect(result.state).toBe('not-found');
});
