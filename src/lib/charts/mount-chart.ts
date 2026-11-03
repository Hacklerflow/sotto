import { BOLD_CONTRAST_THEME_NAME, boldContrastTheme } from './theme';
import type { ChartOption } from './options';

// Browser-only: echarts is imported dynamically so it never runs during SSR.
// Returns a cleanup function that stops observing and disposes the chart.
export async function mountChart(
	element: HTMLElement,
	option: ChartOption
): Promise<() => void> {
	const echarts = await import('echarts');
	echarts.registerTheme(BOLD_CONTRAST_THEME_NAME, boldContrastTheme);
	const chart = echarts.init(element, BOLD_CONTRAST_THEME_NAME);
	chart.setOption(option);
	const observer = new ResizeObserver(() => chart.resize());
	observer.observe(element);
	return () => {
		observer.disconnect();
		chart.dispose();
	};
}
