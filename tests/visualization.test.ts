// @vitest-environment jsdom
import { render } from '@testing-library/svelte';
import { expect, test } from 'vitest';
import HeroNumber from '../src/lib/components/HeroNumber.svelte';
import InsightCard from '../src/lib/components/InsightCard.svelte';
import { barOption, sankeyOption, scatterOption } from '../src/lib/charts/options';
import { boldContrastTheme } from '../src/lib/charts/theme';
import type { AggregatedDimension } from '../src/lib/server/aggregator';

const dimension: AggregatedDimension = {
	index: 0,
	chartType: 'sankey',
	xAxis: 'a',
	yAxis: 'b',
	points: [
		{ x: 'Gallery', y: 'High', count: 6 },
		{ x: 'Online', y: 'High', count: 4 }
	],
	flows: [
		{ source: 'Gallery', target: 'High', count: 6 },
		{ source: 'Online', target: 'High', count: 4 }
	],
	correlation: null,
	suppressedCells: 0
};

test('HeroNumber renders value prominently with context', () => {
	const { getByText } = render(HeroNumber, {
		props: { value: 10, context: 'von 30', subtitle: 'leben von Kunst' }
	});
	const heroEl = getByText('10');
	expect(heroEl.style.fontSize).toMatch(/9[0-9]px|1[0-2][0-9]px/);
	expect(getByText('von 30')).toBeTruthy();
	expect(getByText('leben von Kunst')).toBeTruthy();
});

test('InsightCard shows the counterintuitive badge and correlation value', () => {
	const { getByText } = render(InsightCard, {
		title: 'Alter und Einkommen',
		detail: 'Erklärung',
		type: 'counterintuitive',
		correlation: -0.63
	});
	expect(getByText('Kontraintuitiv')).toBeTruthy();
	expect(getByText('-0.63')).toBeTruthy();
});

test('InsightCard omits the badge for ordinary correlations', () => {
	const { queryByText } = render(InsightCard, {
		title: 't',
		detail: 'd',
		type: 'strong-correlation'
	});
	expect(queryByText('Kontraintuitiv')).toBeNull();
});

test('theme uses the signal colors and no gridlines', () => {
	expect(boldContrastTheme.color).toEqual(['#ff2d55', '#5856d6', '#007aff', '#34c759', '#ffcc00']);
	expect(boldContrastTheme.valueAxis.splitLine.show).toBe(false);
});

test('sankey keeps same labels on both sides as distinct nodes', () => {
	const option = sankeyOption({
		...dimension,
		flows: [{ source: 'Ja', target: 'Ja', count: 5 }]
	}) as { series: { data: { name: string }[] }[] };
	expect(option.series[0].data.map((node) => node.name)).toEqual(['x:Ja', 'y:Ja']);
});

test('scatter symbol size grows with count', () => {
	const option = scatterOption({
		...dimension,
		points: [
			{ x: '1', y: '1', count: 3 },
			{ x: '2', y: '2', count: 12 }
		]
	}) as { series: { data: { symbolSize: number }[] }[] };
	const [small, large] = option.series[0].data;
	expect(large.symbolSize).toBeGreaterThan(small.symbolSize);
});

test('bar stacks counts per y group', () => {
	const option = barOption(dimension) as { series: { name: string; data: number[] }[] };
	expect(option.series).toHaveLength(1);
	expect(option.series[0].data).toEqual([6, 4]);
});
