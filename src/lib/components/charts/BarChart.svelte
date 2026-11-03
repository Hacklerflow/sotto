<script lang="ts">
	import { onMount } from 'svelte';
	import type { AggregatedDimension } from '../../server/aggregator';
	import type { Dimension } from '../../types/survey';
	import { mountChart } from '../../charts/mount-chart';
	import { barOption } from '../../charts/options';

	let { data, config }: { data: AggregatedDimension; config: Dimension } = $props();

	let element: HTMLDivElement;

	onMount(() => {
		let dispose: (() => void) | undefined;
		let unmounted = false;
		mountChart(element, barOption(data)).then((cleanup) => {
			if (unmounted) cleanup();
			else dispose = cleanup;
		});
		return () => {
			unmounted = true;
			dispose?.();
		};
	});
</script>

<div
	bind:this={element}
	class="chart"
	role="img"
	aria-label="{config.chartType}: {config.xAxis} / {config.yAxis}"
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
