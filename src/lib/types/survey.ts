// No free-text question type on purpose: free text can identify respondents.
export const QUESTION_TYPES = ['number', 'single-choice', 'multi-choice', 'range'] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const CHART_TYPES = ['sankey', 'scatter', 'bubble', 'bar'] as const;
export type ChartType = (typeof CHART_TYPES)[number];

export type Question = {
	id: string;
	text: string;
	type: QuestionType;
	options?: string[];
	unit?: string;
	range?: { min: number; max: number };
};

export type Dimension = {
	xAxis: string;
	yAxis: string;
	sizeAxis?: string;
	chartType: ChartType;
};

export type Visualization = {
	dimensionIndex: number;
	title?: string;
};

export type SurveyConfig = {
	questions: Question[];
	dimensions: Dimension[];
	visualizations: Visualization[];
};

export type Survey = {
	id: string;
	title: string;
	config: SurveyConfig;
	status: string;
	thresholdMet: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateQuestion(raw: unknown, seenIds: Set<string>): Question {
	if (!isRecord(raw)) throw new Error('question must be an object');
	if (typeof raw.id !== 'string' || raw.id === '') throw new Error('question id required');
	if (seenIds.has(raw.id)) throw new Error(`duplicate question id: ${raw.id}`);
	seenIds.add(raw.id);
	if (typeof raw.type !== 'string') throw new Error('question type required');
	if (!(QUESTION_TYPES as readonly string[]).includes(raw.type)) {
		throw new Error(`invalid question type: ${raw.type}`);
	}
	const type = raw.type as QuestionType;
	if (typeof raw.text !== 'string' || raw.text.trim() === '') throw new Error('question text required');
	if (type === 'single-choice' || type === 'multi-choice') {
		const options = raw.options;
		if (
			!Array.isArray(options) ||
			options.length < 2 ||
			!options.every((option) => typeof option === 'string' && option.trim() !== '')
		) {
			throw new Error('choice questions need at least two options');
		}
	}
	if (type === 'range') {
		const range = raw.range;
		if (
			!isRecord(range) ||
			typeof range.min !== 'number' ||
			typeof range.max !== 'number' ||
			!(range.min < range.max)
		) {
			throw new Error('range questions need min < max');
		}
	}
	return raw as Question;
}

export function validateSurveyConfig(config: unknown): asserts config is SurveyConfig {
	if (!isRecord(config)) throw new Error('config must be an object');
	const questions = config.questions ?? [];
	if (!Array.isArray(questions)) throw new Error('questions must be an array');
	const ids = new Set<string>();
	for (const question of questions) validateQuestion(question, ids);

	const dimensions = config.dimensions ?? [];
	if (!Array.isArray(dimensions)) throw new Error('dimensions must be an array');
	for (const dimension of dimensions) {
		if (!isRecord(dimension)) throw new Error('dimension must be an object');
		if (!(CHART_TYPES as readonly string[]).includes(dimension.chartType as string)) {
			throw new Error(`invalid chart type: ${String(dimension.chartType)}`);
		}
		const references = [dimension.xAxis, dimension.yAxis];
		if (dimension.sizeAxis !== undefined) references.push(dimension.sizeAxis);
		for (const reference of references) {
			if (typeof reference !== 'string' || !ids.has(reference)) {
				throw new Error(`unknown question id: ${String(reference)}`);
			}
		}
	}

	const visualizations = config.visualizations ?? [];
	if (!Array.isArray(visualizations)) throw new Error('visualizations must be an array');
	for (const visualization of visualizations) {
		if (
			!isRecord(visualization) ||
			!Number.isInteger(visualization.dimensionIndex) ||
			(visualization.dimensionIndex as number) < 0 ||
			(visualization.dimensionIndex as number) >= dimensions.length
		) {
			throw new Error('visualization must reference an existing dimension');
		}
	}
}
