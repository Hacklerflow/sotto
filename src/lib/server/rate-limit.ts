const windows = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;
const CLEANUP_INTERVAL_MS = 300_000;

let lastCleanup = Date.now();

function cleanup() {
	const now = Date.now();
	if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
	lastCleanup = now;
	for (const [key, entry] of windows) {
		if (entry.resetAt <= now) windows.delete(key);
	}
}

export function checkRateLimit(
	identifier: string,
	limit: number = MAX_REQUESTS,
	windowMs: number = WINDOW_MS
): { allowed: boolean; remaining: number; retryAfterMs: number } {
	cleanup();
	const now = Date.now();
	const entry = windows.get(identifier);

	if (!entry || entry.resetAt <= now) {
		windows.set(identifier, { count: 1, resetAt: now + windowMs });
		return { allowed: true, remaining: limit - 1, retryAfterMs: 0 };
	}

	entry.count++;
	if (entry.count > limit) {
		return { allowed: false, remaining: 0, retryAfterMs: entry.resetAt - now };
	}

	return { allowed: true, remaining: limit - entry.count, retryAfterMs: 0 };
}
