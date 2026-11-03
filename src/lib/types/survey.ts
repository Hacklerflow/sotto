// Placeholder: Task 4 replaces this with the full typed survey configuration.
export type SurveyConfig = Record<string, unknown>;

export type Survey = {
	id: string;
	title: string;
	config: SurveyConfig;
	status: string;
	thresholdMet: boolean;
};
