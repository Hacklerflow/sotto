export const SIGNAL_COLORS = [
	'#e8536d',
	'#4a90a4',
	'#6b8f71',
	'#c4915e',
	'#8b7eb8',
	'#d4886c',
	'#5f9ea0',
	'#a0855b',
	'#7c8ea0',
	'#b07aa1'
] as const;

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
