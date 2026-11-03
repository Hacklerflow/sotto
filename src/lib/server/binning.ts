import type { Question } from '../types/survey';

export const MINIMUM_GROUP_SIZE = 3;

export type AnswerValue = number | string | string[];
export type Answers = Record<string, AnswerValue>;

export type NumericBins = { edges: number[]; labels: string[] };

export function isNumericQuestion(question: Question): boolean {
	return question.type === 'number' || question.type === 'range';
}

function quantile(sorted: number[], fraction: number): number {
	const position = (sorted.length - 1) * fraction;
	const lower = Math.floor(position);
	const upper = Math.ceil(position);
	return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

function formatNumber(value: number): string {
	return String(Math.round(value * 100) / 100);
}

// Outer edges are widened to a power-of-ten multiple of the value range so a lone
// outlier's exact value never appears in a bin label.
function coarsenOuterEdges(minimum: number, maximum: number): [number, number] {
	if (minimum === maximum) return [minimum, maximum];
	const step = 10 ** Math.floor(Math.log10(maximum - minimum));
	return [Math.floor(minimum / step) * step, Math.ceil(maximum / step) * step];
}

// Quartile bins: [min, q1), [q1, q2), [q2, q3), [q3, max]. Duplicate edges collapse.
export function computeQuartileBins(values: number[]): NumericBins {
	if (values.length === 0) return { edges: [], labels: [] };
	const sorted = [...values].sort((a, b) => a - b);
	const inner = [0.25, 0.5, 0.75].map((fraction) => quantile(sorted, fraction));
	const [lowerEdge, upperEdge] = coarsenOuterEdges(sorted[0], sorted[sorted.length - 1]);
	const edges = [lowerEdge, ...inner, upperEdge].filter(
		(edge, index, all) => index === 0 || edge > all[index - 1]
	);
	if (edges.length === 1) return { edges, labels: [formatNumber(edges[0])] };
	const labels = edges
		.slice(0, -1)
		.map((edge, index) => `${formatNumber(edge)}–${formatNumber(edges[index + 1])}`);
	return { edges, labels };
}

export function binLabel(bins: NumericBins, value: number): string {
	if (bins.labels.length === 1) return bins.labels[0];
	for (let index = bins.edges.length - 2; index >= 0; index--) {
		if (value >= bins.edges[index]) return bins.labels[index];
	}
	return bins.labels[0];
}

export function numericValues(responses: Answers[], questionId: string): number[] {
	return responses
		.map((answers) => answers[questionId])
		.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
}

// Maps each question to a function turning a raw answer into its anonymized group label(s).
export function buildLabeler(
	question: Question,
	responses: Answers[]
): (answers: Answers) => string[] | null {
	if (isNumericQuestion(question)) {
		const bins = computeQuartileBins(numericValues(responses, question.id));
		return (answers) => {
			const value = answers[question.id];
			return typeof value === 'number' && Number.isFinite(value) ? [binLabel(bins, value)] : null;
		};
	}
	return (answers) => {
		const value = answers[question.id];
		if (typeof value === 'string') return [value];
		if (Array.isArray(value)) return value.length > 0 ? value.map(String) : null;
		return null;
	};
}
