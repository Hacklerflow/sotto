import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit({ adapter: adapter() }), svelteTesting()],
	test: {
		include: ['tests/**/*.test.ts'],
		env: {
			IDENTITY_DB_URL:
				process.env.IDENTITY_DB_URL ?? 'postgres://sotto:sotto-dev@localhost:5433/sotto_identity',
			ANSWER_DB_URL:
				process.env.ANSWER_DB_URL ?? 'postgres://sotto:sotto-dev@localhost:5434/sotto_answer'
		}
	}
});
