<script lang="ts">
	import { mountChart } from '../../charts/mount-chart';
	import { scatterOption, barOption, sankeyOption, bubbleOption } from '../../charts/options';
	import type { AggregatedDimension } from '../../server/aggregator';
	import type { ChartType } from '../../types/survey';

	let { data, chartType }: { data: AggregatedDimension; chartType: ChartType } = $props();

	let element: HTMLDivElement;
	let dispose: (() => void) | undefined;

	function optionForType(dimension: AggregatedDimension, type: ChartType) {
		switch (type) {
			case 'sankey':
				return sankeyOption(dimension);
			case 'bubble':
				return bubbleOption(dimension);
			case 'bar':
				return barOption(dimension);
			default:
				return scatterOption(dimension);
		}
	}

	$effect(() => {
		if (!element || !data) return;
		dispose?.();
		const currentData = data;
		const currentType = chartType;
		let unmounted = false;
		mountChart(element, optionForType(currentData, currentType)).then((cleanup) => {
			if (unmounted) cleanup();
			else dispose = cleanup;
		});
		return () => {
			unmounted = true;
			dispose?.();
			dispose = undefined;
		};
	});
</script>

<div
	bind:this={element}
	class="chart"
	role="img"
	aria-label="Diagramm"
></div>

<style>
	.chart {
		width: 100%;
		height: 420px;
	}
	@media (max-width: 600px) {
		.chart {
			height: 320px;
		}
	}
</style>
