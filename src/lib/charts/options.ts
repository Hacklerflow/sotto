import type { AggregatedDimension } from '../server/aggregator';

// Pure option builders: kept separate from the components so they can be tested without a canvas.
export type ChartOption = Record<string, unknown>;

function uniqueInOrder(values: string[]): string[] {
	return [...new Set(values)];
}

function sortedLabels(labels: string[]): string[] {
	const unique = uniqueInOrder(labels);
	const numeric = unique.map((label) => parseFloat(label));
	if (numeric.every((value) => !Number.isNaN(value))) {
		return unique
			.map((label, index) => ({ label, value: numeric[index] }))
			.sort((a, b) => a.value - b.value)
			.map((entry) => entry.label);
	}
	return unique;
}

const SANKEY_SOURCE_PREFIX = 'x:';
const SANKEY_TARGET_PREFIX = 'y:';

export function sankeyOption(data: AggregatedDimension): ChartOption {
	const flows = data.flows ?? [];
	const sources = sortedLabels(flows.map((flow) => flow.source));
	const targets = sortedLabels(flows.map((flow) => flow.target));
	// Prefixes keep a label that appears on both sides from creating a cycle.
	return {
		series: [
			{
				type: 'sankey',
				left: 8,
				right: 8,
				nodeWidth: 24,
				nodeGap: 12,
				emphasis: { focus: 'adjacency' },
				lineStyle: { color: 'gradient', opacity: 0.45 },
				label: {
					fontSize: 14,
					fontWeight: 700,
					formatter: (parameters: { name: string }) => parameters.name.slice(2)
				},
				data: [
					...sources.map((label) => ({ name: SANKEY_SOURCE_PREFIX + label })),
					...targets.map((label) => ({ name: SANKEY_TARGET_PREFIX + label }))
				],
				links: flows.map((flow) => ({
					source: SANKEY_SOURCE_PREFIX + flow.source,
					target: SANKEY_TARGET_PREFIX + flow.target,
					value: flow.count
				}))
			}
		]
	};
}

function categoryAxes(data: AggregatedDimension) {
	return {
		xAxis: { type: 'category', data: sortedLabels(data.points.map((point) => point.x)) },
		yAxis: { type: 'category', data: sortedLabels(data.points.map((point) => point.y)) }
	};
}

function scaleRadius(value: number, maximum: number, minimumRadius: number, maximumRadius: number) {
	if (maximum <= 0) return minimumRadius;
	// Area, not radius, is proportional to the value.
	return minimumRadius + Math.sqrt(value / maximum) * (maximumRadius - minimumRadius);
}

export function scatterOption(data: AggregatedDimension): ChartOption {
	const maximum = Math.max(1, ...data.points.map((point) => point.count));
	return {
		tooltip: { trigger: 'item' },
		...categoryAxes(data),
		series: [
			{
				type: 'scatter',
				data: data.points.map((point) => ({
					value: [point.x, point.y, point.count],
					symbolSize: scaleRadius(point.count, maximum, 10, 30) * 2
				}))
			}
		]
	};
}

export function bubbleOption(data: AggregatedDimension): ChartOption {
	const measure = (point: AggregatedDimension['points'][number]) => point.size ?? point.count;
	const maximum = Math.max(1, ...data.points.map(measure));
	return {
		tooltip: { trigger: 'item' },
		...categoryAxes(data),
		series: [
			{
				type: 'scatter',
				data: data.points.map((point) => ({
					value: [point.x, point.y, measure(point)],
					symbolSize: scaleRadius(measure(point), maximum, 12, 56) * 2
				})),
				itemStyle: { opacity: 0.8 }
			}
		]
	};
}

export function barOption(data: AggregatedDimension): ChartOption {
	const categories = sortedLabels(data.points.map((point) => point.x));
	const groups = sortedLabels(data.points.map((point) => point.y));
	return {
		tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
		legend: groups.length > 1 ? { top: 0 } : undefined,
		xAxis: { type: 'category', data: categories },
		yAxis: { type: 'value' },
		series: groups.map((group) => ({
			name: group,
			type: 'bar',
			stack: 'total',
			data: categories.map(
				(category) =>
					data.points.find((point) => point.x === category && point.y === group)?.count ?? 0
			)
		}))
	};
}
