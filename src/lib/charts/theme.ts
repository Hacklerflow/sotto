export const SIGNAL_COLORS = ['#ff2d55', '#5856d6', '#007aff', '#34c759', '#ffcc00'] as const;

const FONT_FAMILY =
	"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export const BOLD_CONTRAST_THEME_NAME = 'boldContrast';

const hiddenGrid = { show: false };
const axisStyle = {
	axisLine: { lineStyle: { color: '#000', width: 2 } },
	axisTick: { show: false },
	axisLabel: { fontSize: 14, color: '#000', fontFamily: FONT_FAMILY },
	splitLine: hiddenGrid
};

export const boldContrastTheme = {
	color: [...SIGNAL_COLORS],
	backgroundColor: '#ffffff',
	textStyle: { fontFamily: FONT_FAMILY, fontSize: 14, color: '#000' },
	title: { textStyle: { fontSize: 28, fontWeight: 900, color: '#000' } },
	legend: { textStyle: { fontSize: 14, color: '#000' } },
	tooltip: { textStyle: { fontSize: 14 }, borderColor: '#000', borderWidth: 2 },
	categoryAxis: axisStyle,
	valueAxis: axisStyle,
	grid: { left: 24, right: 24, top: 24, bottom: 24, containLabel: true }
};
