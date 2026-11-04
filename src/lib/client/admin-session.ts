const STORAGE_KEY = 'sotto_admin_secret';

export function loadAdminSecret(): string {
	try {
		return localStorage.getItem(STORAGE_KEY) ?? '';
	} catch {
		return '';
	}
}

export function saveAdminSecret(secret: string): void {
	try {
		if (secret) localStorage.setItem(STORAGE_KEY, secret);
		else localStorage.removeItem(STORAGE_KEY);
	} catch {
		// storage unavailable: the secret only lives for this page view
	}
}

export async function adminFetch(path: string, init: RequestInit = {}): Promise<Response> {
	const headers = new Headers(init.headers);
	headers.set('authorization', `Bearer ${loadAdminSecret()}`);
	if (init.body) headers.set('content-type', 'application/json');
	return fetch(path, { ...init, headers });
}
