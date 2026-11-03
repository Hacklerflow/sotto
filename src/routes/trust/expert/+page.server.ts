import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	buildHash: process.env.BUILD_HASH ?? 'unknown'
});
