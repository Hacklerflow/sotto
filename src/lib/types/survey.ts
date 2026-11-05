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
	const question: Question = { id: raw.id, text: raw.text, type };
	if (type === 'single-choice' || type === 'multi-choice') {
		const options = raw.options;
		if (
			!Array.isArray(options) ||
			options.length < 2 ||
			!options.every((option) => typeof option === 'string' && option.trim() !== '')
		) {
			throw new Error('choice questions need at least two options');
		}
		question.options = options.map(String);
	}
	if (type === 'number' && raw.unit !== undefined) {
		if (typeof raw.unit !== 'string') throw new Error('unit must be a string');
		question.unit = raw.unit;
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
		question.range = { min: range.min, max: range.max };
	}
	return question;
}

export function validateAnswers(
	answers: Record<string, unknown>,
	config: SurveyConfig
): Record<string, unknown> {
	const validated: Record<string, unknown> = {};
	for (const question of config.questions) {
		const value = answers[question.id];
		if (value === undefined || value === null) continue;
		switch (question.type) {
			case 'number':
				if (typeof value !== 'number' || !Number.isFinite(value)) {
					throw new Error(`answer for ${question.id} must be a finite number`);
				}
				validated[question.id] = value;
				break;
			case 'range':
				if (typeof value !== 'number' || !Number.isFinite(value)) {
					throw new Error(`answer for ${question.id} must be a finite number`);
				}
				if (question.range && (value < question.range.min || value > question.range.max)) {
					throw new Error(`answer for ${question.id} out of range`);
				}
				validated[question.id] = value;
				break;
			case 'single-choice':
				if (typeof value !== 'string' || !question.options?.includes(value)) {
					throw new Error(`answer for ${question.id} must be one of the options`);
				}
				validated[question.id] = value;
				break;
			case 'multi-choice':
				if (
					!Array.isArray(value) ||
					!value.every((item) => typeof item === 'string' && question.options?.includes(item))
				) {
					throw new Error(`answer for ${question.id} must be an array of valid options`);
				}
				validated[question.id] = value;
				break;
		}
	}
	return validated;
}

export function validateSurveyConfig(config: unknown): SurveyConfig {
	if (!isRecord(config)) throw new Error('config must be an object');
	const rawQuestions = config.questions ?? [];
	if (!Array.isArray(rawQuestions)) throw new Error('questions must be an array');
	const ids = new Set<string>();
	const questions = rawQuestions.map((question) => validateQuestion(question, ids));

	const rawDimensions = config.dimensions ?? [];
	if (!Array.isArray(rawDimensions)) throw new Error('dimensions must be an array');
	const dimensions: Dimension[] = rawDimensions.map((dimension) => {
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
		const normalized: Dimension = {
			xAxis: dimension.xAxis as string,
			yAxis: dimension.yAxis as string,
			chartType: dimension.chartType as ChartType
		};
		if (dimension.sizeAxis !== undefined) normalized.sizeAxis = dimension.sizeAxis as string;
		return normalized;
	});

	const rawVisualizations = config.visualizations ?? [];
	if (!Array.isArray(rawVisualizations)) throw new Error('visualizations must be an array');
	const visualizations: Visualization[] = rawVisualizations.map((visualization) => {
		if (
			!isRecord(visualization) ||
			typeof visualization.dimensionIndex !== 'number' ||
			!Number.isInteger(visualization.dimensionIndex) ||
			visualization.dimensionIndex < 0 ||
			visualization.dimensionIndex >= dimensions.length
		) {
			throw new Error('visualization must reference an existing dimension');
		}
		const normalized: Visualization = { dimensionIndex: visualization.dimensionIndex };
		if (typeof visualization.title === 'string') normalized.title = visualization.title;
		return normalized;
	});

	return { questions, dimensions, visualizations };
}
