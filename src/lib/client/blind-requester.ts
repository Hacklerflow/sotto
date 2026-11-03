import { RSABSSA } from '@cloudflare/blindrsa-ts';
import { base64ToBytes, bytesToBase64 } from '../encoding';

const MESSAGE_LENGTH_BYTES = 32;
const MIN_DELAY_MS = 1_000;
const MAX_DELAY_MS = 30_000;
const suite = RSABSSA.SHA384.PSS.Deterministic();

export type BlindCredential = { signature: Uint8Array; message: Uint8Array };

function storageKey(surveyId: string): string {
	return `sotto-credential-${surveyId}`;
}

// Page-refresh recovery only; the credential is useless without answers and is removed after submit.
function saveCredential(surveyId: string, credential: BlindCredential): void {
	try {
		sessionStorage.setItem(
			storageKey(surveyId),
			JSON.stringify({
				signature: bytesToBase64(credential.signature),
				message: bytesToBase64(credential.message)
			})
		);
	} catch {
		// sessionStorage unavailable; recovery is best effort.
	}
}

export function loadCredential(surveyId: string): BlindCredential | null {
	try {
		const raw = sessionStorage.getItem(storageKey(surveyId));
		if (!raw) return null;
		const parsed = JSON.parse(raw) as { signature: string; message: string };
		return { signature: base64ToBytes(parsed.signature), message: base64ToBytes(parsed.message) };
	} catch {
		return null;
	}
}

function clearCredential(surveyId: string): void {
	try {
		sessionStorage.removeItem(storageKey(surveyId));
	} catch {
		// ignore
	}
}

// Uniform random integer in [min, max] using the CSPRNG.
function randomBetween(min: number, max: number): number {
	const range = max - min + 1;
	const limit = Math.floor(0x1_0000_0000 / range) * range;
	const buffer = new Uint32Array(1);
	do {
		crypto.getRandomValues(buffer);
	} while (buffer[0] >= limit);
	return min + (buffer[0] % range);
}

async function fetchPublicKey(surveyId: string): Promise<CryptoKey> {
	const response = await fetch(`/api/public-key/${encodeURIComponent(surveyId)}`, {
		// Public data: never send the session cookie, or the server could hand each user a different key.
		credentials: 'omit'
	});
	if (!response.ok) throw new Error('could not load survey public key');
	const { publicKey } = (await response.json()) as { publicKey: string };
	return crypto.subtle.importKey(
		'spki',
		base64ToBytes(publicKey),
		{ name: 'RSA-PSS', hash: 'SHA-384' },
		true,
		['verify']
	);
}

export async function requestBlindSignature(surveyId: string): Promise<BlindCredential> {
	const existing = loadCredential(surveyId);
	if (existing) return existing;

	const publicKey = await fetchPublicKey(surveyId);
	const message = crypto.getRandomValues(new Uint8Array(MESSAGE_LENGTH_BYTES));
	const { blindedMsg, inv } = await suite.blind(publicKey, message);

	// This is the only request that carries the session cookie.
	const response = await fetch('/api/blind-sign', {
		method: 'POST',
		credentials: 'same-origin',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ surveyId, blindedMessage: bytesToBase64(blindedMsg) })
	});
	if (!response.ok) throw new Error(await response.text());
	const { blindSignature } = (await response.json()) as { blindSignature: string };

	const signature = await suite.finalize(publicKey, message, base64ToBytes(blindSignature), inv);
	const credential = { signature, message };
	saveCredential(surveyId, credential);
	return credential;
}

export async function submitAnonymous(
	surveyId: string,
	signature: Uint8Array,
	message: Uint8Array,
	answers: Record<string, unknown>
): Promise<void> {
	// Random delay decorrelates the submission time from the signing request.
	await new Promise((resolve) => setTimeout(resolve, randomBetween(MIN_DELAY_MS, MAX_DELAY_MS)));
	// credentials: 'omit' guarantees no session cookie accompanies the answers.
	const response = await fetch('/api/submit-anonymous', {
		method: 'POST',
		credentials: 'omit',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({
			surveyId,
			signature: bytesToBase64(signature),
			message: bytesToBase64(message),
			answers
		})
	});
	if (!response.ok) throw new Error(await response.text());
	clearCredential(surveyId);
}
