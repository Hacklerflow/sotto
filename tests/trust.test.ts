// @vitest-environment jsdom
import { render } from '@testing-library/svelte';
import { expect, test } from 'vitest';
import TrustBadge from '../src/lib/components/TrustBadge.svelte';

test('TrustBadge links to trust page', () => {
	const { getByRole } = render(TrustBadge);
	const link = getByRole('link');
	expect(link.getAttribute('href')).toBe('/trust');
	expect(link.textContent).toContain('anonym');
});
