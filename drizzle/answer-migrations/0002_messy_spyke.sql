CREATE TABLE "result_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"survey_id" uuid NOT NULL,
	"frozen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"data" jsonb NOT NULL
);
